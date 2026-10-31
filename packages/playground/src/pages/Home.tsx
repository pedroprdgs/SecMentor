import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  LockKeyhole,
  Code2,
  BookOpen,
  Sparkles,
  Pause,
  Play,
  Check,
  Github,
} from 'lucide-react';
import { t } from '../i18n/index.js';
import { lessons, ruleCount } from '../lib/content.js';
import { GITHUB } from '../lib/constants.js';
export default function Home() {
  const [paused, setPaused] = useState(false);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="little-line" />
            {t.home.kicker}
          </span>
          <h1>{t.home.title}</h1>
          <p>{t.home.subtitle}</p>
          <div className="button-row">
            <Link className="button primary" to="/analisar">
              {t.home.primary}
              <ArrowRight size={16} />
            </Link>
            <Link className="button hero-secondary" to="/demo">
              <Play size={14} />
              {t.home.demo}
            </Link>
          </div>
          <small>
            <LockKeyhole size={12} />
            {t.home.proof}
          </small>
          <div className="hero-counts">
            <div>
              <strong>{ruleCount.toString().padStart(2, '0')}</strong>
              <span>{t.home.ruleCount}</span>
            </div>
            <div>
              <strong>{lessons.length.toString().padStart(2, '0')}</strong>
              <span>{t.home.lessonCount}</span>
            </div>
            <div>
              <strong>0%</strong>
              <span>{t.home.localCount}</span>
            </div>
          </div>
        </div>
        <div
          className={`mentor-demo ${paused ? 'paused' : ''}`}
          aria-label={t.home.demoTitle}
        >
          <div className="demo-window-heading">
            <span>
              <span className="window-dot" />
              <span className="window-dot" />
              <span className="window-dot" />
            </span>
            <span>primeiro-projeto.ts</span>
            <button
              className="icon-button"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? t.demo.resume : t.demo.pause}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
          <div className="demo-code">
            <div className="code-meta">
              <Code2 size={14} />
              <span>{t.home.demoLabel}</span>
            </div>
            <pre>
              <span className="code-muted">01 </span>
              <span className="code-purple">app</span>.get(
              <span className="code-green">"/usuarios"</span>, (req, res) =&gt;{' '}
              {'{'}
              {'\n'}
              <span className="code-muted">02 </span>{' '}
              <span className="code-purple">const</span> id = req.query.id;
              {'\n'}
              <span className="code-muted">03 </span> db.query({'\n'}
              <span className="highlight-code">
                <span className="code-muted">04 </span>{' '}
                <span className="code-green">
                  "SELECT * FROM users WHERE id = "
                </span>{' '}
                + id
              </span>
              {'\n'}
              <span className="code-muted">05 </span> );{'\n'}
              <span className="code-muted">06 </span>
              {'}'});
            </pre>
          </div>
          <div className="mini-finding">
            <span className="mini-number">01</span>
            <div>
              <span className="eyebrow">SM001 · {t.severity.alta}</span>
              <strong>{lessons[0].titulo}</strong>
              <p>{t.home.demoFinding}</p>
            </div>
            <ArrowUpRight size={18} />
          </div>
          <div className="mini-lesson">
            <span className="lesson-symbol">
              <BookOpen size={19} />
            </span>
            <div>
              <span className="eyebrow">{t.lesson.kicker}</span>
              <p>{t.home.demoExplanation}</p>
              <Link to="/licoes/SM001">
                {t.library.open}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="demo-window-footer">
            <span className="status-dot" />
            {t.local}
            <span>{t.tagline}</span>
          </div>
        </div>
      </section>
      <section className="how-section">
        <div className="section-heading">
          <span className="eyebrow">01 — 02 — 03</span>
          <h2>{t.home.how}</h2>
        </div>
        <div className="how-steps">
          {t.home.steps.map((step, i) => {
            const Icon = [Code2, BookOpen, Sparkles][i];
            return (
              <article key={step.title}>
                <div>
                  <span className="step-index">0{i + 1}</span>
                  <Icon size={23} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="privacy-section">
        <div className="privacy-illustration" aria-hidden="true">
          <div className="privacy-orbit" />
          <LockKeyhole size={55} strokeWidth={1.2} />
          <span>
            <Check size={12} />
            {t.local}
          </span>
        </div>
        <div>
          <span className="eyebrow">{t.noUpload}</span>
          <h2>{t.home.privacyTitle}</h2>
          <p>{t.home.privacyText}</p>
          <Link className="text-link" to="/sobre">
            {t.home.privacyLink}
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
      <section className="supported-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t.nav.lessons}</span>
            <h2>{t.home.rulesTitle}</h2>
          </div>
          <Link className="text-link" to="/licoes">
            {t.common.all}
            <ArrowRight size={15} />
          </Link>
        </div>
        <p>{t.home.rulesText}</p>
        <div className="supported-rules">
          {lessons.map((l) => (
            <Link key={l.id} to={`/licoes/${l.id}`}>
              <span>{l.id}</span>
              {l.titulo}
              <ArrowUpRight size={13} />
            </Link>
          ))}
        </div>
      </section>
      <section className="community-section">
        <div>
          <span className="eyebrow">{t.contribute.kicker}</span>
          <h2>{t.home.community}</h2>
          <p>{t.home.communityText}</p>
        </div>
        <div className="button-row">
          <Link className="button primary" to="/contribuir">
            {t.home.communityCTA}
            <ArrowRight size={15} />
          </Link>
          <a href={GITHUB} target="_blank" rel="noreferrer" className="button">
            <Github size={16} />
            {t.github}
          </a>
        </div>
      </section>
    </>
  );
}
