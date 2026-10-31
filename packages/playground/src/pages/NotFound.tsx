import { Link } from 'react-router-dom';
import { t } from '../i18n/index.js';
export default function NotFound() {
  return (
    <div className="not-found">
      <span className="eyebrow">404 · {t.brand}</span>
      <h1>{t.notFound.title}</h1>
      <p>{t.notFound.text}</p>
      <Link className="button primary" to="/">
        {t.notFound.home}
      </Link>
    </div>
  );
}
