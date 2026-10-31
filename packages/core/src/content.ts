// Entrada leve para interfaces: não carrega scanner, filesystem nem cliente HTTP.
export { lessons } from './lessons.generated.js';
export { lessonSchema, severityRank, severitySchema } from './types.js';
export type { Lesson, Severity, Finding, ScanResult, SourceFile } from './types.js';
