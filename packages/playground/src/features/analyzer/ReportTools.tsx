import { useState } from 'react';
import { Download, Printer, Share2, Copy } from 'lucide-react';
import type { ScanResult, SourceFile } from '@secmentor/core/content';
import { lessons } from '../../lib/content.js';
import { t } from '../../i18n/index.js';
import { Modal, SeverityBadge } from '../../components/ui/index.js';
import { download } from '../../lib/download.js';
import { encodeShared } from './share.js';
export default function ReportTools({
  result,
  files,
}: {
  result: ScanResult;
  files: SourceFile[];
}) {
  const [share, setShare] = useState(false);
  const [url, setUrl] = useState('');
  const [notice, setNotice] = useState('');
  async function exportFile(format: 'json' | 'sarif') {
    const { toJSON, toSARIF } = await import('@secmentor/core');
    download(
      format === 'json' ? toJSON(result) : toSARIF(result),
      `secmentor.${format}`,
      format === 'json' ? 'application/json' : 'application/sarif+json',
    );
  }
  async function createLink() {
    try {
      if (files.length !== 1) throw new Error(t.analyzer.shareTooLarge);
      const hash = await encodeShared(files[0].path, files[0].content);
      setUrl(
        `${location.origin}${import.meta.env.BASE_URL}analisar#codigo=${hash}`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t.analyzer.shareBad);
    }
  }
  return (
    <section className="report-container">
      <div className="report-toolbar no-print">
        <div>
          <span className="eyebrow">{t.analyzer.report}</span>
          <p>{t.report.note}</p>
        </div>
        <div className="button-row">
          <button className="button" onClick={() => void exportFile('json')}>
            <Download size={14} />
            {t.analyzer.exportJSON}
          </button>
          <button className="button" onClick={() => void exportFile('sarif')}>
            <Download size={14} />
            {t.analyzer.exportSARIF}
          </button>
          <button className="button" onClick={() => window.print()}>
            <Printer size={14} />
            {t.analyzer.print}
          </button>
          <button
            className="button"
            onClick={() => {
              setShare(true);
              setUrl('');
              setNotice('');
            }}
          >
            <Share2 size={14} />
            {t.analyzer.share}
          </button>
        </div>
      </div>
      <div className="print-only">
        <h1>{t.report.title}</h1>
        <p>
          {t.report.generated} · {new Date().toLocaleString('pt-BR')}
        </p>
        <p>
          {t.analyzer.scanned(result.filesScanned, result.durationMs)} ·{' '}
          {t.analyzer.found(result.findings.length)}
        </p>
        <p>{t.report.caveat}</p>
        {result.findings.map((f, i) => {
          const lesson = lessons.find((l) => l.id === f.lessonId)!;
          return (
            <article className="print-finding" key={i}>
              <h2>
                {f.ruleId} · {f.title}
              </h2>
              <SeverityBadge value={f.severity} />
              <p>
                {f.file}:{f.line}:{f.column} · {f.message}
              </p>
              <h3>{t.lesson.why}</h3>
              <p>{lesson.por_que_e_perigoso}</p>
              <h3>{t.lesson.before}</h3>
              <pre>{lesson.exemplo_vulneravel}</pre>
              <h3>{t.lesson.after}</h3>
              <pre>{lesson.exemplo_corrigido}</pre>
              <h3>{t.lesson.checklist}</h3>
              <ul>
                {lesson.checklist_de_correcao.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              {lesson.referencias.map((url) => (
                <p key={url}>{url}</p>
              ))}
            </article>
          );
        })}
        {result.warnings.map((w, i) => (
          <p key={i}>
            {w.file}: {w.message}
          </p>
        ))}
      </div>
      {share && (
        <Modal title={t.analyzer.share} onClose={() => setShare(false)}>
          <p>{t.analyzer.shareWarning}</p>
          {url ? (
            <>
              <label>
                {t.analyzer.shareReady}
                <textarea readOnly value={url} rows={4} />
              </label>
              <button
                className="button primary"
                onClick={() =>
                  void navigator.clipboard.writeText(url).then(
                    () => setNotice(t.common.copied),
                    () => setNotice(t.common.copyError),
                  )
                }
              >
                <Copy size={15} />
                {t.common.copyLink}
              </button>
            </>
          ) : (
            <button
              className="button primary"
              onClick={() => void createLink()}
            >
              {t.analyzer.shareConfirm}
            </button>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}
