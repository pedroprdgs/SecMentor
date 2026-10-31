import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Search } from 'lucide-react';
import { lessons, topic } from '../lib/content.js';
import { t } from '../i18n/index.js';
import { SeverityBadge, Empty } from '../components/ui/index.js';
import { useProgress } from '../features/progress/store.js';
export default function Library() {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('');
  const [theme, setTheme] = useState('all');
  const completed = useProgress((s) => s.completed);
  const filtered = lessons.filter(
    (l) =>
      (!severity || l.severidade === severity) &&
      (theme === 'all' || topic(l.id) === theme) &&
      `${l.id} ${l.titulo} ${l.resumo}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR')),
  );
  return (
    <>
      <header className="page-header">
        <span className="eyebrow">{t.library.kicker}</span>
        <h1>{t.library.title}</h1>
        <p>{t.library.subtitle}</p>
      </header>
      <div className="library-filters">
        <label className="search-field">
          <Search size={17} />
          <span className="sr-only">{t.library.search}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.library.search}
            aria-label={t.library.search}
          />
        </label>
        <label>
          <span className="sr-only">{t.contribute.theme}</span>
          <select
            aria-label={t.contribute.theme}
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="">{t.common.all}</option>
            {Object.entries(t.severity).map(([id, text]) => (
              <option key={id} value={id}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t.library.theme}</span>
          <select
            aria-label={t.library.theme}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            {Object.entries(t.library.themes).map(([id, text]) => (
              <option key={id} value={id}>
                {text}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="lesson-grid">
        {filtered.map((l) => (
          <Link className="lesson-card panel" key={l.id} to={`/licoes/${l.id}`}>
            <div>
              <span className="eyebrow">{l.id}</span>
              <SeverityBadge value={l.severidade} />
            </div>
            <h2>{l.titulo}</h2>
            <p>{l.resumo}</p>
            <span className="card-footer">
              {completed.includes(l.id) ? (
                <>
                  <CheckCircle2 size={15} />
                  {t.library.completed}
                </>
              ) : (
                t.library.open
              )}
              <ArrowUpRight size={17} />
            </span>
          </Link>
        ))}
      </div>
      {!filtered.length && <Empty title={t.library.noResults} />}
    </>
  );
}
