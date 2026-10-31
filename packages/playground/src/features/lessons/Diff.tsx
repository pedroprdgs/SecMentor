import { diffLines } from 'diff';
import { t } from '../../i18n/index.js';
export default function Diff({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const parts = diffLines(before, after);
  return (
    <div className="diff-grid">
      <div>
        <div className="diff-label before">{t.lesson.before}</div>
        <pre>
          {parts
            .filter((p) => !p.added)
            .map((p, i) => (
              <span key={i} className={p.removed ? 'diff-removed' : ''}>
                {p.value}
              </span>
            ))}
        </pre>
      </div>
      <div>
        <div className="diff-label after">{t.lesson.after}</div>
        <pre>
          {parts
            .filter((p) => !p.removed)
            .map((p, i) => (
              <span key={i} className={p.added ? 'diff-added' : ''}>
                {p.value}
              </span>
            ))}
        </pre>
      </div>
    </div>
  );
}
