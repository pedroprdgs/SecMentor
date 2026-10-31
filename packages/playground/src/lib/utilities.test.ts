import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAnalyzer } from '../features/analyzer/store.js';
import {
  detectLanguage,
  languagePath,
  safePath,
  validateProject,
  preflightZip,
  MAX_FILE,
  readZip,
} from '../features/analyzer/files.js';
import {
  useProgress,
  emptyProgress,
  nextStreak,
  level,
} from '../features/progress/store.js';
import {
  useSettings,
  defaults,
  resolvedTheme,
} from '../features/settings/store.js';
import { lessons } from './content.js';
import { applySafeFix } from '../features/lessons/fix.js';
import {
  lessonDraft,
  validateDraft,
  lessonYAML,
} from '../features/contribute/model.js';
import { shuffle, questionsFor } from '../features/quiz/model.js';
import { safeStorage, clearLocalData } from './storage.js';
import { t } from '../i18n/index.js';
import type { Finding } from '@secmentor/core/content';
beforeEach(() => {
  localStorage.clear();
  useAnalyzer.getState().clear();
  useProgress.setState(emptyProgress);
  useSettings.setState(defaults);
});
describe('analisador e entradas', () => {
  it('detecta linguagem e mantém a pasta ao sobrescrever linguagem', () => {
    expect(detectLanguage('src/App.tsx')).toBe('tsx');
    expect(detectLanguage('.env.local')).toBe('env');
    expect(detectLanguage('package.json')).toBe('json');
    expect(languagePath('src/app.js', 'tsx')).toBe('src/app.tsx');
    expect(languagePath('src/a.js', 'json')).toBe('src/package.json');
  });
  it('recusa travessia e limites de expansão', () => {
    expect(safePath('../secret.ts')).toBeNull();
    expect(safePath('node_modules/a.js')).toBeNull();
    expect(safePath('src\\app.ts')).toBe('src/app.ts');
    expect(() =>
      validateProject([{ path: 'a.ts', content: 'x'.repeat(MAX_FILE + 1) }]),
    ).toThrow();
    expect(() => preflightZip(new ArrayBuffer(20))).toThrow();
    const buffer = new ArrayBuffer(47);
    const view = new DataView(buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint32(24, 0xffffffff, true);
    expect(() => preflightZip(buffer)).toThrow();
  });
  it('lê ZIP sem executar fontes e rejeita tamanho excessivo declarado', async () => {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    zip.file('src/app.ts', 'eval(input)');
    zip.file('readme.txt', 'não é código');
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    const result = await readZip(new File([buffer], 'project.zip'));
    expect(result).toEqual([{ path: 'src/app.ts', content: 'eval(input)' }]);
  });
  it('não persiste código e rejeita resultados de uma revisão antiga', () => {
    const store = useAnalyzer.getState();
    store.replace([{ path: 'a.ts', content: 'const secret="teste"' }]);
    const revision = useAnalyzer.getState().revision;
    store.edit('a.ts', 'const seguro=1');
    store.complete(
      { findings: [], warnings: [], filesScanned: 1, durationMs: 1 },
      revision,
    );
    expect(useAnalyzer.getState().result).toBeUndefined();
    expect(Object.values(localStorage).join('')).not.toContain('const secret');
  });
  it('aplica apenas o patch esperado e recusa offsets desatualizados', () => {
    const source = 'httpOnly: false';
    const finding = {
      ruleId: 'SM009',
      fix: { start: 10, end: 15, replacement: 'true' },
    } as Finding;
    expect(applySafeFix(source, finding)).toBe('httpOnly: true');
    expect(() => applySafeFix('httpOnly: true', finding)).toThrow();
  });
});
describe('progresso e preferências locais', () => {
  it('pontua somente acertos e revisa erros sem duplicar lições', () => {
    const store = useProgress.getState();
    store.recordAnswer('SM001', false);
    expect(useProgress.getState().wrong).toEqual(['SM001']);
    store.recordAnswer('SM001', true);
    store.recordAnswer('SM001', true);
    expect(useProgress.getState()).toMatchObject({
      points: 40,
      correct: 2,
      answered: 3,
      completed: ['SM001'],
      wrong: [],
    });
  });
  it('calcula sequência por dia local, sem contar repetições no mesmo dia', () => {
    expect(nextStreak('2026-10-30', 3, new Date(2026, 9, 31))).toEqual({
      lastDay: '2026-10-31',
      days: 4,
    });
    expect(nextStreak('2026-10-31', 4, new Date(2026, 9, 31))).toMatchObject({
      days: 4,
    });
    expect(nextStreak('2026-10-28', 4, new Date(2026, 9, 31))).toMatchObject({
      days: 1,
    });
  });
  it('registra conquistas e histórico sem trechos de código', () => {
    for (let i = 0; i < 10; i++)
      useProgress.getState().recordAnswer('SM001', true);
    useProgress.getState().awardFix();
    useProgress.getState().recordAnalysis(['app.ts'], 3, 40);
    expect(useProgress.getState().achievements).toEqual(
      expect.arrayContaining(['first', 'ten', 'fixed']),
    );
    expect(level(200)).toBe(t.progress.guardian);
    expect(JSON.stringify(useProgress.getState().history)).not.toContain(
      'content',
    );
  });
  it('IA desligada por padrão, tema do sistema e exclusão limitada ao SecMentor', () => {
    expect(useSettings.getState().ai.enabled).toBe(false);
    expect(resolvedTheme('system', true)).toBe('dark');
    expect(resolvedTheme('light', true)).toBe('light');
    safeStorage.setItem('outro-app', 'preservar');
    safeStorage.setItem('secmentor-web-settings', 'teste');
    clearLocalData();
    expect(localStorage.getItem('outro-app')).toBe('preservar');
    expect(localStorage.getItem('secmentor-web-settings')).toBeNull();
  });
  it('armazenamento indisponível não interrompe a sessão', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota');
      });
    expect(() => safeStorage.setItem('secmentor-web-test', 'x')).not.toThrow();
    spy.mockRestore();
  });
});
describe('conteúdo e quiz', () => {
  it('valida YAML pelo schema do core e rejeita alternativa fora do intervalo', () => {
    const draft = lessonDraft(lessons[0]);
    const valid = validateDraft(draft);
    expect(valid.success).toBe(true);
    if (valid.success) expect(lessonYAML(valid.data)).toContain('id: SM001');
    expect(validateDraft({ ...draft, resposta: '99' }).success).toBe(false);
    expect(
      validateDraft({ ...draft, referencias: 'javascript:alert(1)' }).success,
    ).toBe(false);
  });
  it('embaralha sem perder a identidade da resposta correta', () => {
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
    const questions = questionsFor(lessons);
    expect(questions).toHaveLength(12);
    expect(new Set(questions.map((q) => q.id)).size).toBe(12);
  });
});
