import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X, Award } from 'lucide-react';
import { t } from '../../i18n/index.js';
import { shuffle, type Question } from './model.js';
import { useProgress } from '../progress/store.js';
export default function QuizRunner({
  questions,
  onRestart,
}: {
  questions: Question[];
  onRestart?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number>();
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [options, setOptions] = useState(() =>
    shuffle(
      questions[0].question.opcoes.map((text, original) => ({
        text,
        original,
      })),
    ),
  );
  const item = questions[index];
  const q = item.question;
  const answered = choice !== undefined;
  const correct = answered && options[choice].original === q.resposta;
  function answer(value: number) {
    if (answered) return;
    setChoice(value);
    const right = options[value].original === q.resposta;
    if (right) setScore((n) => n + 1);
    useProgress.getState().recordAnswer(item.lessonId, right);
  }
  function next() {
    if (index === questions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setChoice(undefined);
    setOptions(
      shuffle(
        questions[index + 1].question.opcoes.map((text, original) => ({
          text,
          original,
        })),
      ),
    );
  }
  if (finished)
    return (
      <div className="quiz-complete panel" role="status">
        <Award size={46} />
        <span className="eyebrow">{t.quiz.complete}</span>
        <h2>{t.quiz.finished}</h2>
        <p>{t.quiz.earned(score)}</p>
        <strong>
          {score * 20} {t.quiz.points}
        </strong>
        <div className="button-row">
          <Link className="button primary" to="/progresso">
            {t.nav.progress}
            <ArrowRight size={15} />
          </Link>
          {onRestart && (
            <button className="button" onClick={onRestart}>
              {t.quiz.restart}
            </button>
          )}
        </div>
      </div>
    );
  return (
    <section className="quiz-runner panel" aria-label={t.nav.quiz}>
      <div className="quiz-progress">
        <span>{t.quiz.count(index + 1, questions.length)}</span>
        <span>
          {score * 20} {t.quiz.points}
        </span>
        <progress
          max={questions.length}
          value={index + (answered ? 1 : 0)}
          aria-label={t.quiz.count(index + 1, questions.length)}
        />
      </div>
      <div className="quiz-content">
        <div>
          <span className="eyebrow">
            {item.lessonId} · {item.lessonTitle}
          </span>
          <h2>{q.pergunta}</h2>
          <p>{t.quiz.oneAtTime}</p>
          <Link className="text-link" to={`/licoes/${item.lessonId}`}>
            {t.quiz.viewLesson}
            <ArrowRight size={14} />
          </Link>
        </div>
        <div>
          <fieldset className="quiz-options">
            <legend className="sr-only">{t.quiz.options}</legend>
            {options.map((option, i) => (
              <button
                key={i}
                className={`quiz-answer ${choice === i ? (correct ? 'correct' : 'incorrect') : answered && option.original === q.resposta ? 'correct' : ''}`}
                disabled={answered}
                onClick={() => answer(i)}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {option.text}
                {answered && option.original === q.resposta ? (
                  <Check size={17} />
                ) : choice === i ? (
                  <X size={17} />
                ) : null}
              </button>
            ))}
          </fieldset>
          {answered && (
            <div
              className={`quiz-feedback ${correct ? 'correct' : 'incorrect'}`}
              role="status"
            >
              <strong>{correct ? t.quiz.correct : t.quiz.wrong}</strong>
              <p>{q.explicacao}</p>
              <button className="button primary" onClick={next}>
                {index === questions.length - 1 ? t.quiz.finish : t.quiz.next}
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
