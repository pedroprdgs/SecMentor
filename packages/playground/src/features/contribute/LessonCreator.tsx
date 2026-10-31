import { useRef, useState } from 'react';
import { Download, Github, CheckCircle2 } from 'lucide-react';
import { lessons } from '../../lib/content.js';
import { GITHUB } from '../../lib/constants.js';
import { download } from '../../lib/download.js';
import { t } from '../../i18n/index.js';
import {
  lessonDraft,
  validateDraft,
  lessonYAML,
  type LessonDraft,
} from './model.js';
const fields: {
  key: keyof LessonDraft;
  label: string;
  lines?: boolean;
  large?: boolean;
}[] = [
  { key: 'id', label: t.contribute.id },
  { key: 'titulo', label: t.contribute.titleField },
  { key: 'resumo', label: t.contribute.summary, large: true },
  { key: 'por_que_e_perigoso', label: t.contribute.why, large: true },
  { key: 'exemplo_vulneravel', label: t.contribute.vulnerable, large: true },
  { key: 'exemplo_corrigido', label: t.contribute.corrected, large: true },
  {
    key: 'como_explorar_inofensivo',
    label: t.contribute.harmless,
    large: true,
  },
  {
    key: 'erros_comuns_de_iniciante',
    label: t.contribute.mistakes,
    large: true,
    lines: true,
  },
  {
    key: 'checklist_de_correcao',
    label: t.contribute.checklist,
    large: true,
    lines: true,
  },
  {
    key: 'referencias',
    label: t.contribute.references,
    large: true,
    lines: true,
  },
  { key: 'pergunta', label: t.contribute.question, large: true },
  { key: 'opcoes', label: t.contribute.options, large: true, lines: true },
  { key: 'resposta', label: t.contribute.answer },
  { key: 'explicacao', label: t.contribute.explanation, large: true },
];
export default function LessonCreator() {
  const [draft, setDraft] = useState(() => lessonDraft(lessons[0]));
  const [notice, setNotice] = useState('');
  const validation = validateDraft(draft);
  const errorRef = useRef<HTMLDivElement>(null);
  const yaml = validation.success ? lessonYAML(validation.data) : '';
  const errors = validation.success
    ? []
    : [
        ...new Set(
          validation.error.issues.map((issue) =>
            String(issue.path[0] ?? t.contribute.schemaError),
          ),
        ),
      ];
  function check() {
    if (!validation.success) {
      setNotice(t.contribute.schemaError);
      errorRef.current?.focus();
      return false;
    }
    return true;
  }
  function propose() {
    if (!check()) return;
    const url = `${GITHUB}/issues/new?title=${encodeURIComponent(`[Lição] ${draft.id} · ${draft.titulo}`)}&body=${encodeURIComponent('```yaml\n' + yaml + '\n```')}`;
    if (url.length > 7500) {
      setNotice(t.contribute.tooLong);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return (
    <section className="creator" aria-label={t.contribute.creator}>
      <div className="creator-form panel">
        <div className="panel-heading">
          <h2>{t.contribute.creator}</h2>
        </div>
        <div className="creator-fields">
          <p className="help">{t.contribute.creatorText}</p>
          <label>
            {t.contribute.base}
            <select
              onChange={(e) => {
                setDraft(
                  lessonDraft(lessons.find((l) => l.id === e.target.value)!),
                );
                setNotice('');
              }}
              defaultValue={lessons[0].id}
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} · {l.titulo}
                </option>
              ))}
            </select>
          </label>
          <div className="field-grid">
            {fields.map((field) => (
              <label
                className={field.large ? 'field-full' : ''}
                key={field.key}
              >
                {field.label}
                {field.large ? (
                  <textarea
                    rows={field.key.includes('exemplo') ? 4 : 3}
                    value={draft[field.key]}
                    aria-invalid={errors.includes(field.key)}
                    aria-describedby={
                      field.lines ? field.key + '-hint' : undefined
                    }
                    onChange={(e) =>
                      setDraft({ ...draft, [field.key]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    value={draft[field.key]}
                    aria-invalid={errors.includes(field.key)}
                    onChange={(e) =>
                      setDraft({ ...draft, [field.key]: e.target.value })
                    }
                  />
                )}
                {field.lines && (
                  <small id={field.key + '-hint'}>
                    {t.contribute.onePerLine}
                  </small>
                )}
              </label>
            ))}
            <label>
              {t.contribute.theme}
              <select
                value={draft.severidade}
                onChange={(e) =>
                  setDraft({ ...draft, severidade: e.target.value })
                }
              >
                {Object.entries(t.severity).map(([id, text]) => (
                  <option value={id} key={id}>
                    {text}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            ref={errorRef}
            tabIndex={-1}
            className={validation.success ? 'notice' : 'warning'}
            role="status"
          >
            {validation.success ? (
              <>
                <CheckCircle2 size={14} /> {t.contribute.valid}
              </>
            ) : (
              <>
                {t.contribute.invalid}:{' '}
                {errors
                  .map(
                    (key) =>
                      fields.find((f) => f.key === key)?.label ??
                      t.contribute.schemaError,
                  )
                  .join(', ')}
              </>
            )}
          </div>
          {notice && (
            <p role="alert" className="warning">
              {notice}
            </p>
          )}
          <div className="button-row">
            <button
              className="button primary"
              onClick={() => {
                if (check())
                  download(yaml, `${draft.id}.yaml`, 'application/yaml');
              }}
            >
              <Download size={15} />
              {t.common.download}
            </button>
            <button className="button" onClick={propose}>
              <Github size={15} />
              {t.contribute.issue}
            </button>
          </div>
          <p className="help">{t.contribute.privacy}</p>
        </div>
      </div>
      <aside className="creator-preview panel">
        <div className="panel-heading">
          <h3>{t.contribute.preview}</h3>
          <span className="tag">YAML</span>
        </div>
        {validation.success ? (
          <>
            <div className="creator-preview-heading">
              <span className="eyebrow">{validation.data.id}</span>
              <h3>{validation.data.titulo}</h3>
              <p>{validation.data.resumo}</p>
            </div>
            <pre>{yaml}</pre>
          </>
        ) : (
          <div className="empty-state">
            <p>{t.contribute.schemaError}</p>
          </div>
        )}
      </aside>
    </section>
  );
}
