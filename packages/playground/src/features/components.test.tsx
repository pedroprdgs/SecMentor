import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lessons } from '../lib/content.js';
import { t } from '../i18n/index.js';
import Results from './analyzer/Results.js';
import LessonPanel from './lessons/LessonPanel.js';
import QuizRunner from './quiz/QuizRunner.js';
import { questionsFor } from './quiz/model.js';
import LessonCreator from './contribute/LessonCreator.js';
import { useSettings, defaults } from './settings/store.js';
import type { Finding, ScanResult } from '@secmentor/core/content';
const finding: Finding = {
  ruleId: 'SM001',
  lessonId: 'SM001',
  title: lessons[0].titulo,
  severity: 'alta',
  file: 'app.ts',
  line: 1,
  column: 1,
  endLine: 1,
  endColumn: 10,
  message: lessons[0].resumo,
  snippet: 'db.query(input)',
};
const result: ScanResult = {
  findings: [finding],
  warnings: [],
  filesScanned: 1,
  durationMs: 20,
};
beforeEach(() => {
  useSettings.setState(defaults);
});
const wrap = (element: React.ReactNode) =>
  render(<MemoryRouter>{element}</MemoryRouter>);
describe('resultados', () => {
  it('filtra por busca e seleciona um achado', () => {
    const select = vi.fn();
    render(<Results result={result} onSelect={select} stale={false} />);
    fireEvent.click(screen.getByRole('button', { name: /SQL injection/ }));
    expect(select).toHaveBeenCalledWith(finding);
    fireEvent.change(screen.getByLabelText(t.analyzer.search), {
      target: { value: 'inexistente' },
    });
    expect(screen.getByText(t.analyzer.noMatches)).toBeInTheDocument();
  });
  it('distingue nenhum achado de resultados desatualizados', () => {
    const { rerender } = render(
      <Results
        result={{ ...result, findings: [] }}
        onSelect={() => {}}
        stale={false}
      />,
    );
    expect(screen.getByText(t.analyzer.noFindings)).toBeInTheDocument();
    rerender(<Results result={result} onSelect={() => {}} stale />);
    expect(screen.getByText(t.analyzer.stale)).toBeInTheDocument();
  });
});
describe('painel de lição', () => {
  it('mostra conteúdo real, diff e bloqueia IA não configurada', async () => {
    wrap(<LessonPanel id="SM001" />);
    expect(screen.getByText(lessons[0].por_que_e_perigoso)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: t.lesson.another }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('tab', { name: t.lesson.diff }));
    await waitFor(() =>
      expect(screen.getByText(t.lesson.after)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(lessons[0].exemplo_corrigido, { exact: false }),
    ).toBeInTheDocument();
  });
  it('não chama o endpoint antes da confirmação explícita', () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    useSettings.getState().update({
      ai: {
        enabled: true,
        baseUrl: 'http://127.0.0.1:1234/v1',
        model: 'teste',
        apiKey: '',
      },
    });
    wrap(<LessonPanel id="SM001" />);
    fireEvent.click(screen.getByRole('button', { name: t.lesson.another }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(t.lesson.aiWarning)).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: t.common.cancel,
      }),
    );
    expect(request).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
describe('quiz', () => {
  it('oferece feedback imediato e conclui uma pergunta', () => {
    wrap(<QuizRunner questions={questionsFor([lessons[0]])} />);
    fireEvent.click(
      screen.getByRole('button', { name: /Query parametrizada/ }),
    );
    expect(screen.getByText(t.quiz.correct)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: t.quiz.finish }));
    expect(screen.getByText(t.quiz.finished)).toBeInTheDocument();
  });
});
describe('criador de lição', () => {
  it('pré-visualiza YAML válido e aponta erro de resposta', () => {
    render(<LessonCreator />);
    expect(screen.getByText(t.contribute.valid)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(t.contribute.answer), {
      target: { value: '99' },
    });
    expect(
      screen.getByText(t.contribute.invalid, { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByText(t.contribute.valid)).not.toBeInTheDocument();
  });
});
