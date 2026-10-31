import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  FileCode2,
  FolderOpen,
  FileArchive,
  Play,
  Plus,
  X,
  ArrowRight,
} from 'lucide-react';
import { t } from '../i18n/index.js';
import { Empty, Loading, Modal } from '../components/ui/index.js';
import { useAnalyzer } from '../features/analyzer/store.js';
import { useSettings } from '../features/settings/store.js';
import { scanInWorker } from '../features/analyzer/worker-client.js';
import {
  readFiles,
  readZip,
  droppedFiles,
  languagePath,
  type Language,
} from '../features/analyzer/files.js';
import { examples, type Example } from '../lib/examples.js';
import Results from '../features/analyzer/Results.js';
import type { SourceFile } from '@secmentor/core/content';
const Editor = lazy(() => import('../features/analyzer/Editor.js'));
const LessonPanel = lazy(() => import('../features/lessons/LessonPanel.js'));
const ReportTools = lazy(() => import('../features/analyzer/ReportTools.js'));
export default function Analyzer() {
  const state = useAnalyzer();
  const fontSize = useSettings((s) => s.fontSize);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState(false);
  const [replace, setReplace] = useState<Example>();
  const [undoToken, setUndoToken] = useState(0);
  const [correction, setCorrection] = useState<{
    path: string;
    revision: number;
  }>();
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const zipInput = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController>();
  const active = state.files.find((f) => f.path === state.active);
  const stale = state.revision !== state.analyzedRevision;
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    let cancelled = false;
    const hash = new URLSearchParams(window.location.hash.slice(1)).get(
      'codigo',
    );
    if (hash) {
      void import('../features/analyzer/share.js')
        .then((module) => module.decodeShared(hash))
        .then(async (file) => {
          if (cancelled) return;
          useAnalyzer.getState().replace([file]);
          const revision = useAnalyzer.getState().revision;
          const controller = new AbortController();
          abort.current = controller;
          setBusy(true);
          const result = await scanInWorker(
            [file],
            (done, total) => setProgress({ done, total }),
            controller.signal,
          );
          if (!cancelled) useAnalyzer.getState().complete(result, revision);
        })
        .catch(() => {
          if (!cancelled) setNotice(t.analyzer.shareBad);
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, []);
  async function analyze() {
    if (!state.files.length) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setNotice('');
    setProgress({ done: 0, total: state.files.length });
    const revision = state.revision;
    try {
      const files = state.files.map((f) => ({
        ...f,
        path:
          f.path === state.active
            ? languagePath(f.path, state.language)
            : f.path,
      }));
      const result = await scanInWorker(
        files,
        (done, total) => setProgress({ done, total }),
        controller.signal,
      );
      const mapped = {
        ...result,
        findings: result.findings.map((f) => ({
          ...f,
          file:
            f.file === languagePath(state.active, state.language)
              ? state.active
              : f.file,
        })),
      };
      state.complete(mapped, revision);
      const { useProgress } = await import('../features/progress/store.js');
      useProgress.getState().recordAnalysis(
        state.files.map((f) => f.path),
        result.findings.length,
        result.durationMs,
      );
      setNotice(t.analyzer.found(result.findings.length));
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : t.analyzer.workerError,
      );
    } finally {
      if (abort.current === controller) setBusy(false);
    }
  }
  async function add(files: File[]) {
    setImporting(true);
    setNotice('');
    try {
      const sources: SourceFile[] = [];
      for (const file of files)
        if (file.name.toLowerCase().endsWith('.zip'))
          sources.push(...(await readZip(file)));
        else sources.push(...(await readFiles([file])));
      if (!sources.length) setNotice(t.analyzer.importIgnored);
      else {
        state.merge(sources);
        if (sources.length < files.length) setNotice(t.analyzer.importIgnored);
      }
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : t.analyzer.importError,
      );
    } finally {
      setImporting(false);
    }
  }
  function load(example: Example) {
    if (state.files.some((f) => f.content.trim())) setReplace(example);
    else state.replace(example.files);
  }
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">{t.analyzer.kicker}</span>
        <h1>{t.analyzer.title}</h1>
        <p>{t.analyzer.subtitle}</p>
      </header>
      <div
        className={`import-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const transfer = e.dataTransfer;
          void droppedFiles(transfer)
            .then(add)
            .catch(() => setNotice(t.analyzer.importError));
        }}
      >
        <div>
          <FolderOpen size={22} aria-hidden="true" />
          <div>
            <strong>{t.analyzer.drop}</strong>
            <p>{t.analyzer.formats}</p>
          </div>
        </div>
        <div className="button-row">
          <button
            className="button"
            disabled={importing}
            onClick={() => fileInput.current?.click()}
          >
            <Plus size={15} />
            {t.analyzer.import}
          </button>
          <button
            className="button"
            disabled={importing}
            onClick={() => folderInput.current?.click()}
          >
            <FolderOpen size={15} />
            {t.analyzer.folder}
          </button>
          <button
            className="button"
            disabled={importing}
            onClick={() => zipInput.current?.click()}
          >
            <FileArchive size={15} />
            {t.analyzer.zip}
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="sr-only"
          aria-label={t.analyzer.import}
          onChange={(e) => {
            void add(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        <input
          ref={folderInput}
          type="file"
          multiple
          {...{ webkitdirectory: '', directory: '' }}
          className="sr-only"
          aria-label={t.analyzer.folder}
          onChange={(e) => {
            void add(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        <input
          ref={zipInput}
          type="file"
          accept=".zip"
          className="sr-only"
          aria-label={t.analyzer.zip}
          onChange={(e) => {
            void add(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </div>
      <details
        className="example-gallery"
        open={!state.files.some((f) => f.content)}
      >
        <summary>
          {t.analyzer.gallery}
          <span>{t.analyzer.galleryHint}</span>
        </summary>
        <div>
          {examples.map((example) => (
            <button key={example.id} onClick={() => load(example)}>
              {example.id !== 'project' && <span>{example.id}</span>}
              {example.title}
              <ArrowRight size={13} />
            </button>
          ))}
        </div>
      </details>
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      {importing && <Loading />}
      <div
        className={`analysis-layout ${state.files.length > 1 ? 'has-tree' : ''}`}
      >
        {state.files.length > 1 && (
          <aside className="file-tree panel" aria-label={t.analyzer.files}>
            <div className="panel-heading">
              <h2>{t.analyzer.files}</h2>
            </div>
            {state.files.map((file) => (
              <div className="file-row" key={file.path}>
                <button
                  className={state.active === file.path ? 'active' : ''}
                  onClick={() => state.setActive(file.path)}
                >
                  <FileCode2 size={14} />
                  <span>{file.path}</span>
                </button>
                <button
                  className="icon-button"
                  aria-label={`${t.analyzer.remove}: ${file.path}`}
                  onClick={() =>
                    state.replace(
                      state.files.filter((f) => f.path !== file.path),
                    )
                  }
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </aside>
        )}
        <section className="editor-panel panel">
          <div className="panel-heading">
            <span className="file-title">
              <FileCode2 size={16} />
              {active?.path ?? t.analyzer.editor}
            </span>
            <label className="language-select">
              <span className="sr-only">{t.analyzer.language}</span>
              <select
                aria-label={t.analyzer.language}
                value={state.language}
                onChange={(e) => state.setLanguage(e.target.value as Language)}
              >
                {(
                  ['auto', 'js', 'ts', 'jsx', 'tsx', 'json', 'env'] as const
                ).map((mode) => (
                  <option value={mode} key={mode}>
                    {t.analyzer[mode]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {active ? (
            <Suspense fallback={<Loading />}>
              <Editor
                path={active.path}
                content={active.content}
                onChange={(content) => {
                  state.edit(active.path, content);
                  setCorrection(undefined);
                }}
                findings={
                  !stale
                    ? (state.result?.findings.filter(
                        (f) => f.file === active.path,
                      ) ?? [])
                    : []
                }
                selected={!stale ? state.selected : undefined}
                language={state.language}
                fontSize={fontSize}
                undoToken={undoToken}
              />
            </Suspense>
          ) : (
            <Empty title={t.analyzer.emptyFiles} />
          )}
          <div className="editor-bottom">
            <span className="local-badge">
              <span className="status-dot" />
              {t.noUpload}
            </span>
            {correction?.path === state.active &&
              correction?.revision === state.revision && (
                <button
                  className="button"
                  onClick={() => {
                    setUndoToken((n) => n + 1);
                    setCorrection(undefined);
                  }}
                >
                  {t.lesson.undo}
                </button>
              )}
            {busy ? (
              <button className="button" onClick={() => abort.current?.abort()}>
                {t.analyzer.cancel}
              </button>
            ) : (
              <button
                className="button primary"
                disabled={!active}
                onClick={() => void analyze()}
              >
                <Play size={14} />
                {t.analyzer.analyze}
              </button>
            )}
          </div>
          {busy && (
            <div className="scan-progress" role="status">
              <span>
                {t.analyzer.analyzing}{' '}
                {t.analyzer.progress(progress.done, progress.total)}
              </span>
              <progress value={progress.done} max={progress.total || 1} />
            </div>
          )}
        </section>
        <Results
          result={state.result}
          selected={state.selected}
          onSelect={state.select}
          stale={stale}
        />
      </div>
      {state.selected && !stale && (
        <Suspense fallback={<Loading />}>
          <LessonPanel
            id={state.selected.lessonId}
            finding={state.selected}
            onApplied={() => {
              setNotice(t.lesson.applied);
              const current = useAnalyzer.getState();
              setCorrection({
                path: current.active,
                revision: current.revision,
              });
            }}
            onUndo={() => setUndoToken((n) => n + 1)}
          />
        </Suspense>
      )}
      {state.result && !stale && (
        <Suspense fallback={null}>
          <ReportTools result={state.result} files={state.files} />
        </Suspense>
      )}
      <p className="help">{t.analyzer.gitLimit}</p>
      <p className="help">{t.analyzer.sourcePrivate}</p>
      {replace && (
        <Modal title={t.analyzer.gallery} onClose={() => setReplace(undefined)}>
          <p>{t.analyzer.replace}</p>
          <div className="modal-actions">
            <button className="button" onClick={() => setReplace(undefined)}>
              {t.common.cancel}
            </button>
            <button
              className="button primary"
              onClick={() => {
                state.replace(replace.files);
                setReplace(undefined);
              }}
            >
              {t.common.confirm}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
