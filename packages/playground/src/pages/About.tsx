import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { t } from '../i18n/index.js';
import { GITHUB } from '../lib/constants.js';
export default function About() {
  return (
    <div className="document-page">
      <header className="page-header">
        <span className="eyebrow">{t.about.kicker}</span>
        <h1>{t.about.title}</h1>
        <p>{t.about.text}</p>
      </header>
      <section>
        <h2>{t.about.localTitle}</h2>
        <p>{t.about.localText}</p>
      </section>
      <section>
        <h2>{t.about.limitsTitle}</h2>
        <p>{t.about.limits}</p>
      </section>
      <section>
        <h2>{t.about.supportTitle}</h2>
        <p>{t.about.support}</p>
        <div className="button-row">
          <Link className="button primary" to="/contribuir">
            {t.nav.contribute}
            <ArrowUpRight size={15} />
          </Link>
          <a className="button" href={GITHUB} target="_blank" rel="noreferrer">
            {t.about.docs}
          </a>
        </div>
      </section>
    </div>
  );
}
