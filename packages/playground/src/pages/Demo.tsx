import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, RotateCcw, ArrowRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import type { ScanResult } from '@secmentor/core/content';
import { t } from '../i18n/index.js';
import { lessons } from '../lib/content.js';
import { scanInWorker } from '../features/analyzer/worker-client.js';
import LessonPanel from '../features/lessons/LessonPanel.js';
import QuizRunner from '../features/quiz/QuizRunner.js';
import { questionsFor } from '../features/quiz/model.js';
const lesson = lessons[0];
export default function Demo() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ScanResult>();
  const [run, setRun] = useState(0);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(Boolean(reduced));
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setStep(0);
    setResult(undefined);
    setError('');
    scanInWorker(
      [{ path: 'demonstracao.ts', content: lesson.exemplo_vulneravel }],
      () => {},
      controller.signal,
    )
      .then(setResult)
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : t.analyzer.workerError,
          );
      });
    return () => controller.abort();
  }, [run]);
  useEffect(() => {
    if (paused || !result || step >= 3) return;
    const timer = setTimeout(
      () => setStep((n) => n + 1),
      step === 0 ? 2000 : 6500,
    );
    return () => clearTimeout(timer);
  }, [paused, result, step]);
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">{t.demo.kicker}</span>
        <h1>{t.demo.title}</h1>
        <p>{t.demo.subtitle}</p>
      </header>
      <div className="demo-controls">
        <ol className="demo-steps">
          {t.demo.steps.map((text, i) => (
            <li key={text}>
              <button
                aria-current={step === i ? 'step' : undefined}
                onClick={() => {
                  setStep(i);
                  setPaused(true);
                }}
              >
                <span>0{i + 1}</span>
                {text}
              </button>
            </li>
          ))}
        </ol>
        <div className="button-row">
          <button className="button" onClick={() => setPaused(!paused)}>
            {paused ? <Play size={14} /> : <Pause size={14} />}{' '}
            {paused ? t.demo.resume : t.demo.pause}
          </button>
          <button
            className="icon-button"
            aria-label={t.demo.restart}
            onClick={() => {
              setRun((n) => n + 1);
              setPaused(Boolean(reduced));
            }}
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>
      {error && (
        <div className="warning" role="alert">
          {error}
        </div>
      )}
      {step === 0 ? (
        <section className="demo-scan panel">
          <div>
            <span className="eyebrow">{t.home.demoLabel}</span>
            <pre>{lesson.exemplo_vulneravel}</pre>
          </div>
          <div>
            {result ? (
              <>
                <strong>{t.analyzer.found(result.findings.length)}</strong>
                <h2>{lesson.titulo}</h2>
                <p>{t.home.demoFinding}</p>
              </>
            ) : (
              <p role="status">{t.demo.initial}</p>
            )}
            <button
              className="button primary"
              disabled={!result}
              onClick={() => setStep(1)}
            >
              {t.common.next}
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      ) : step < 3 ? (
        <LessonPanel
          key={run}
          id={lesson.id}
          tab={step === 2 ? 'diff' : 'understand'}
          onTabChange={(tab) => {
            setStep(tab === 'diff' ? 2 : 1);
            setPaused(true);
          }}
        />
      ) : (
        <>
          <QuizRunner key={run} questions={questionsFor([lesson])} />
          <Link className="button primary demo-end" to="/analisar">
            {t.demo.end}
            <ArrowRight size={15} />
          </Link>
        </>
      )}
    </>
  );
}
