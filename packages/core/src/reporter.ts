import { rules } from './scanner.js';
import { lessons } from './lessons.generated.js';
import type { Lesson, ScanResult } from './types.js';

export function toJSON(result: ScanResult): string {
  return JSON.stringify(
    {
      ...result,
      findings: result.findings.map((f) => ({
        ...f,
        snippet: f.ruleId === 'SM003' ? '[credencial ocultada]' : f.snippet,
      })),
    },
    null,
    2,
  );
}
export function toTerminal(
  result: ScanResult,
  color: (text: string, severity: string) => string = (text) => text,
): string {
  const entries = result.findings.map(
    (f) =>
      `${color(f.severity.toUpperCase(), f.severity)} ${f.ruleId} · ${f.title}\n  ${f.file}:${f.line}:${f.column}\n  ${f.line} │ ${f.ruleId === 'SM003' ? '[credencial ocultada]' : f.snippet}\n  ${f.message}\n  Lição: secmentor explain ${f.lessonId}`,
  );
  return [
    ...entries,
    ...result.warnings.map((w) => `AVISO ${w.file}: ${w.message}`),
    `${result.findings.length} achado(s) · ${result.filesScanned} arquivo(s) · ${Math.round(result.durationMs)} ms`,
    'Heurísticas educativas: ausência de achados não garante segurança.',
  ].join('\n\n');
}
export function toSARIF(result: ScanResult, prefix = ''): string {
  return JSON.stringify(
    {
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'SecMentor',
              version: '0.1.0',
              informationUri:
                'https://owasp.org/www-community/Source_Code_Analysis_Tools',
              rules: rules.map((r) => ({
                id: r.id,
                name: r.title,
                shortDescription: { text: r.title },
                help: {
                  text:
                    lessons.find((l) => l.id === r.id)!.resumo +
                    ` Leia: secmentor explain ${r.id}`,
                },
                properties: { tags: ['security', 'education', 'pt-BR'] },
              })),
            },
          },
          invocations: [
            {
              executionSuccessful: result.warnings.length === 0,
              toolExecutionNotifications: result.warnings.map((w) => ({
                level: 'warning',
                message: { text: `${w.file}: ${w.message}` },
              })),
            },
          ],
          results: result.findings.map((f) => ({
            ruleId: f.ruleId,
            level: ['alta', 'critica'].includes(f.severity)
              ? 'error'
              : f.severity === 'media'
                ? 'warning'
                : 'note',
            message: {
              text: `${f.message} Leia: secmentor explain ${f.lessonId}`,
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: (prefix + f.file)
                      .split('/')
                      .map(encodeURIComponent)
                      .join('/'),
                    uriBaseId: '%SRCROOT%',
                  },
                  region: {
                    startLine: f.line,
                    startColumn: f.column,
                    endLine: f.endLine,
                    endColumn: Math.max(f.column + 1, f.endColumn),
                  },
                },
              },
            ],
          })),
        },
      ],
    },
    null,
    2,
  );
}
export function formatLesson(lesson: Lesson): string {
  return `${lesson.id} · ${lesson.titulo} (${lesson.severidade})\n\n${lesson.resumo}\n\nPor que é perigoso\n${lesson.por_que_e_perigoso}\n\nExemplo vulnerável\n${lesson.exemplo_vulneravel}\n\nExemplo corrigido\n${lesson.exemplo_corrigido}\n\nExperimento inofensivo\n${lesson.como_explorar_inofensivo}\n\nErros comuns\n${lesson.erros_comuns_de_iniciante.map((e) => `• ${e}`).join('\n')}\n\nChecklist\n${lesson.checklist_de_correcao.map((c) => `☐ ${c}`).join('\n')}\n\nReferências\n${lesson.referencias.join('\n')}`;
}
