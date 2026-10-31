import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { t } from '../../i18n/index.js';
import { SeverityBadge, Empty } from '../../components/ui/index.js';
import type { Finding, ScanResult } from '@secmentor/core/content';
export default function Results({
  result,
  selected,
  onSelect,
  stale,
}: {
  result?: ScanResult;
  selected?: Finding;
  onSelect: (finding: Finding) => void;
  stale: boolean;
}) {
  const [severity, setSeverity] = useState('');
  const [rule, setRule] = useState('');
  const [file, setFile] = useState('');
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      result?.findings.filter(
        (f) =>
          (!severity || f.severity === severity) &&
          (!rule || f.ruleId === rule) &&
          (!file || f.file === file) &&
          `${f.title} ${f.message} ${f.ruleId} ${f.file}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ) ?? [],
    [result, severity, rule, file, query],
  );
  const files = [...new Set(filtered.map((f) => f.file))];
  return (
    <section className="results panel" aria-label={t.analyzer.results}>
      <div className="panel-heading">
        <h2>{t.analyzer.results}</h2>
        <span className="tag">
          {t.analyzer.found(result?.findings.length ?? 0)}
        </span>
      </div>
      {stale && result ? (
        <div className="warning">{t.analyzer.stale}</div>
      ) : (
        <>
          {result && (
            <>
              <div className="severity-summary">
                {(['critica', 'alta', 'media', 'baixa'] as const).map((s) => (
                  <button
                    key={s}
                    aria-pressed={severity === s}
                    onClick={() => setSeverity(severity === s ? '' : s)}
                  >
                    <SeverityBadge value={s} />
                    <strong>
                      {result.findings.filter((f) => f.severity === s).length}
                    </strong>
                  </button>
                ))}
              </div>
              <div className="result-filters">
                <label className="search-field">
                  <Search size={15} aria-hidden="true" />
                  <span className="sr-only">{t.analyzer.search}</span>
                  <input
                    aria-label={t.analyzer.search}
                    placeholder={t.analyzer.search}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label>
                  <span className="sr-only">{t.analyzer.rule}</span>
                  <select
                    aria-label={t.analyzer.rule}
                    value={rule}
                    onChange={(e) => setRule(e.target.value)}
                  >
                    <option value="">
                      {t.analyzer.rule}: {t.common.all}
                    </option>
                    {[...new Set(result.findings.map((f) => f.ruleId))].map(
                      (id) => (
                        <option key={id}>{id}</option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  <span className="sr-only">{t.analyzer.file}</span>
                  <select
                    aria-label={t.analyzer.file}
                    value={file}
                    onChange={(e) => setFile(e.target.value)}
                  >
                    <option value="">
                      {t.analyzer.file}: {t.common.all}
                    </option>
                    {[...new Set(result.findings.map((f) => f.file))].map(
                      (path) => (
                        <option key={path}>{path}</option>
                      ),
                    )}
                  </select>
                </label>
                {(severity || rule || file || query) && (
                  <button
                    className="text-link"
                    onClick={() => {
                      setSeverity('');
                      setRule('');
                      setFile('');
                      setQuery('');
                    }}
                  >
                    {t.common.clearFilters}
                  </button>
                )}
              </div>
            </>
          )}
          {!result ? (
            <Empty title={t.analyzer.empty}>{t.analyzer.emptyText}</Empty>
          ) : !result.findings.length ? (
            <Empty title={t.analyzer.noFindings}>
              {t.analyzer.noFindingsTips}
            </Empty>
          ) : !filtered.length ? (
            <Empty title={t.analyzer.noMatches} />
          ) : (
            <div className="finding-groups">
              {files.map((path) => (
                <section key={path}>
                  <h3>{path}</h3>
                  {filtered
                    .filter((f) => f.file === path)
                    .map((f, i) => (
                      <button
                        className={`finding ${selected === f ? 'selected' : ''}`}
                        key={`${f.ruleId}-${f.line}-${i}`}
                        onClick={() => onSelect(f)}
                      >
                        <span className="finding-content">
                          <strong>{f.title}</strong>
                          <span>
                            {f.ruleId} · {t.analyzer.line(f.line)}
                          </span>
                        </span>
                        <SeverityBadge value={f.severity} />
                        <ChevronRight size={15} />
                      </button>
                    ))}
                </section>
              ))}
            </div>
          )}
          {result?.warnings.map((w, i) => (
            <div role="alert" className="warning" key={i}>
              {w.file}: {w.message}
            </div>
          ))}
        </>
      )}
      {result && (
        <div className="result-footer">
          {t.analyzer.scanned(result.filesScanned, result.durationMs)}
        </div>
      )}
    </section>
  );
}
