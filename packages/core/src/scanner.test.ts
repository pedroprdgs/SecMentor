import { describe, expect, it } from 'vitest';
import { scanSource } from './scanner.js';
import { lessons, lessonSchema } from './index.js';

describe('detecção inicial offline', () => {
  for (const lesson of lessons) {
    it(`${lesson.id}: conteúdo válido`, () => expect(lessonSchema.safeParse(lesson).success).toBe(true));
    it(`${lesson.id}: encontra vulnerabilidade`, () => expect(scanSource({ path: 'app.js', content: lesson.exemplo_vulneravel }).findings.some(f => f.ruleId === lesson.id)).toBe(true));
    it(`${lesson.id}: aceita correção`, () => expect(scanSource({ path: 'app.js', content: lesson.exemplo_corrigido }).findings.filter(f => f.ruleId === lesson.id)).toEqual([]));
    it(`${lesson.id}: ignora comentário`, () => expect(scanSource({ path: 'app.js', content: '// ' + lesson.exemplo_vulneravel.replaceAll('\n', '\n// ') }).findings).toEqual([]));
  }
});
