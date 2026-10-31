import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { Finding } from '@secmentor/core/content';
import { lessonFor } from '../../lib/content.js';
import { t } from '../../i18n/index.js';
import {
  Modal,
  SeverityBadge,
  Tabs,
  Loading,
  Empty,
} from '../../components/ui/index.js';
import { useSettings } from '../settings/store.js';
import { useAnalyzer } from '../analyzer/store.js';
import { applySafeFix } from './fix.js';
const Diff = lazy(() => import('./Diff.js'));
export type LessonTab = 'understand' | 'diff';
export default function LessonPanel({
  id,
  finding,
  onApplied,
  tab: controlledTab,
  onTabChange,
}: {
  id: string;
  finding?: Finding;
  onApplied?: () => void;
  onUndo?: () => void;
  tab?: LessonTab;
  onTabChange?: (value: LessonTab) => void;
}) {
  const lesson = lessonFor(id);
  const [internalTab, setInternalTab] = useState<LessonTab>('understand');
  const tab = controlledTab ?? internalTab;
  const change = (value: string) => {
    setInternalTab(value as LessonTab);
    onTabChange?.(value as LessonTab);
  };
  const [notice, setNotice] = useState('');
  const [question, setQuestion] = useState('');
  const [request, setRequest] = useState<'explain' | 'answer' | 'quiz'>();
  const [answer, setAnswer] = useState('');
  const [answerSource, setAnswerSource] = useState<'ia' | 'local'>('ia');
  const [busy, setBusy] = useState(false);
  const [extra, setExtra] = useState<NonNullable<typeof lesson>['quiz']>();
  const ai = useSettings((s) => s.ai);
  const reduced = useReducedMotion();
  if (!lesson) return <Empty title={t.lesson.unknown} />;
  async function copy() {
    try {
      await navigator.clipboard.writeText(lesson!.exemplo_corrigido);
      setNotice(t.common.copied);
    } catch {
      setNotice(t.common.copyError);
    }
  }
  function apply() {
    try {
      const state = useAnalyzer.getState();
      const file = state.files.find((f) => f.path === finding?.file);
      if (!file || !finding || state.revision !== state.analyzedRevision)
        throw new Error(t.lesson.fixConflict);
      state.edit(file.path, applySafeFix(file.content, finding));
      void import('../progress/store.js').then(({ useProgress }) =>
        useProgress.getState().awardFix(),
      );
      onApplied?.();
      setNotice(t.lesson.applied);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t.lesson.fixConflict);
    }
  }
  async function send() {
    const task = request;
    setRequest(undefined);
    if (!task) return;
    setBusy(true);
    setAnswer('');
    setAnswerSource('ia');
    if (task === 'quiz') setExtra(undefined);
    setNotice('');
    try {
      const { OpenAICompatibleProvider } = await import('@secmentor/core/llm');
      const provider = new OpenAICompatibleProvider({
        baseUrl: ai.baseUrl,
        model: ai.model,
        apiKey: ai.apiKey,
      });
      if (task === 'quiz') setExtra(await provider.generateQuiz(lesson!));
      else
        setAnswer(
          task === 'answer'
            ? await provider.answer(lesson!, question)
            : await provider.explain(lesson!),
        );
    } catch {
      setAnswerSource('local');
      setAnswer(lesson!.resumo + '\n\n' + lesson!.por_que_e_perigoso);
      setNotice(t.lesson.fallback);
    } finally {
      setBusy(false);
    }
  }
  const configured = ai.enabled && ai.baseUrl && ai.model;
  return (
    <motion.section
      className="lesson-panel panel"
      aria-label={`${t.lesson.kicker}: ${lesson.titulo}`}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="lesson-panel-heading">
        <div className="lesson-heading">
          <span className="lesson-symbol">
            <BookOpen size={21} />
          </span>
          <div>
            <span className="eyebrow">
              {t.lesson.kicker} · {lesson.id}
            </span>
            <h2>{lesson.titulo}</h2>
          </div>
          <SeverityBadge value={lesson.severidade} />
        </div>
        <Tabs
          value={tab}
          onChange={change}
          tabs={[
            { id: 'understand', label: t.lesson.understand },
            { id: 'diff', label: t.lesson.diff },
          ]}
        />
      </div>
      <div role="tabpanel" id={'panel-' + tab} aria-labelledby={'tab-' + tab}>
        {tab === 'understand' ? (
          <div className="lesson-content">
            <div>
              <p className="lesson-summary">{lesson.resumo}</p>
              <h3>{t.lesson.why}</h3>
              <p>{lesson.por_que_e_perigoso}</p>
              <h3>{t.lesson.checklist}</h3>
              <ul className="checklist">
                {lesson.checklist_de_correcao.map((item) => (
                  <li key={item}>
                    <Check size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lesson-side">
              <span className="eyebrow">{t.lesson.harmless}</span>
              <p>{lesson.como_explorar_inofensivo}</p>
              <details>
                <summary>{t.lesson.mistakes}</summary>
                <ul>
                  {lesson.erros_comuns_de_iniciante.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
              <h3>{t.lesson.references}</h3>
              {lesson.referencias
                .filter((url) => url.startsWith('https://'))
                .map((url) => (
                  <a
                    className="reference-link"
                    href={url}
                    key={url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {new URL(url).hostname}
                    <ArrowUpRight size={13} />
                  </a>
                ))}
            </div>
          </div>
        ) : (
          <>
            <Suspense fallback={<Loading />}>
              <Diff
                before={lesson.exemplo_vulneravel}
                after={lesson.exemplo_corrigido}
              />
            </Suspense>
            <div className="diff-actions">
              <p>{t.lesson.context}</p>
              <div className="button-row">
                <button className="button" onClick={() => void copy()}>
                  <Copy size={15} />
                  {t.common.copy}
                </button>
                {finding?.fix ? (
                  <button className="button primary" onClick={apply}>
                    <Wand2 size={15} />
                    {t.lesson.apply}
                  </button>
                ) : (
                  <span className="help">{t.lesson.noFix}</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="lesson-actions">
        <Link className="button primary" to={`/quiz?licao=${lesson.id}`}>
          {t.lesson.quiz}
          <ArrowUpRight size={14} />
        </Link>
        <Link className="text-link" to={`/licoes/${lesson.id}`}>
          {t.lesson.shared}
        </Link>
        <span
          className="ai-button-wrap"
          title={configured ? '' : t.lesson.aiHint}
        >
          <button
            className="button"
            disabled={!configured || busy}
            onClick={() => setRequest('explain')}
          >
            <Sparkles size={15} />
            {t.lesson.another}
          </button>
        </span>
        {!configured && (
          <Link className="help" to="/configuracoes">
            {t.lesson.aiHint}
          </Link>
        )}
      </div>
      {configured && (
        <div className="ai-tutor">
          <label>
            {t.lesson.ask}
            <textarea
              rows={2}
              value={question}
              maxLength={4000}
              placeholder={t.lesson.questionPlaceholder}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              className="button"
              disabled={busy}
              onClick={() =>
                question.trim()
                  ? setRequest('answer')
                  : setNotice(t.lesson.promptRequired)
              }
            >
              {t.lesson.send}
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={() => setRequest('quiz')}
            >
              {t.lesson.extraQuiz}
            </button>
          </div>
        </div>
      )}
      {busy && (
        <div className="notice" role="status">
          {t.lesson.aiBusy}
        </div>
      )}
      {answer && (
        <div className="ai-answer">
          <span className="eyebrow">
            {answerSource === 'ia' ? t.lesson.aiReview : t.lesson.localSource}
          </span>
          <p>{answer}</p>
        </div>
      )}
      {extra && (
        <div className="extra-quiz">
          <h3>{t.quiz.aiQuestions}</h3>
          {extra.map((q, i) => (
            <details key={i}>
              <summary>{q.pergunta}</summary>
              <ol>
                {q.opcoes.map((option) => (
                  <li key={option}>{option}</li>
                ))}
              </ol>
              <p>
                {q.opcoes[q.resposta]} · {q.explicacao}
              </p>
            </details>
          ))}
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      {request && (
        <Modal title={t.settings.ai} onClose={() => setRequest(undefined)}>
          <p>{t.lesson.aiWarning}</p>
          <code className="endpoint">{ai.baseUrl}</code>
          <div className="modal-actions">
            <button className="button" onClick={() => setRequest(undefined)}>
              {t.common.cancel}
            </button>
            <button className="button primary" onClick={() => void send()}>
              {t.lesson.aiSend}
            </button>
          </div>
        </Modal>
      )}
    </motion.section>
  );
}
