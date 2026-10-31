import { describe, it, expect, vi } from 'vitest';
import { lessons } from './index.js';
import {
  OpenAICompatibleProvider,
  providerFromEnv,
  mentorExplanation,
  mentorQuiz,
  type LLMProvider,
} from './llm.js';
const lesson = lessons[0];
const config = {
  baseUrl: 'http://127.0.0.1:1234/v1/',
  model: 'modelo-local',
  apiKey: 'ficticia',
};
const response = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }));
describe('IA opcional sem participação na detecção', () => {
  it('permanece desligada mesmo com ambiente configurado', () => {
    expect(
      providerFromEnv(false, {
        SECMENTOR_LLM_BASE_URL: config.baseUrl,
        SECMENTOR_LLM_MODEL: config.model,
      }),
    ).toBeUndefined();
    expect(providerFromEnv(true, {})).toBeUndefined();
    expect(
      providerFromEnv(true, {
        SECMENTOR_LLM_BASE_URL: 'x',
        SECMENTOR_LLM_MODEL: 'x',
      }),
    ).toBeUndefined();
    expect(
      providerFromEnv(true, {
        SECMENTOR_LLM_BASE_URL: config.baseUrl,
        SECMENTOR_LLM_MODEL: 'x',
      }),
    ).toBeInstanceOf(OpenAICompatibleProvider);
  });
  it('valida URL, protocolo e modelo', () => {
    for (const baseUrl of [
      'file:///tmp/a',
      'https://user:pass@example.org',
      'https://example.org/?x=y',
      'https://example.org/#x',
    ])
      expect(
        () => new OpenAICompatibleProvider({ ...config, baseUrl }),
      ).toThrow();
    expect(
      () => new OpenAICompatibleProvider({ ...config, model: ' ' }),
    ).toThrow();
  });
  it('contrato HTTP envia somente lição e tarefa', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response('Uma explicação em português.'));
    const provider = new OpenAICompatibleProvider(config, request);
    const output = await mentorExplanation(
      { ruleId: lesson.id },
      lesson,
      provider,
    );
    expect(output.source).toBe('ia');
    const [url, init] = request.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:1234/v1/chat/completions');
    expect(init?.redirect).toBe('error');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer ficticia' });
    const body = JSON.parse(init?.body as string);
    expect(body.model).toBe('modelo-local');
    expect(body.messages).toHaveLength(2);
    expect(JSON.parse(body.messages[1].content).lesson.id).toBe('SM001');
    expect(JSON.stringify(body)).not.toContain('snippet');
  });
  it('responde dúvidas e gera quiz validado', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response('Sobre parâmetros…'))
      .mockResolvedValueOnce(
        response('```json\n' + JSON.stringify(lesson.quiz) + '\n```'),
      );
    const provider = new OpenAICompatibleProvider(
      { ...config, apiKey: undefined },
      request,
    );
    expect(
      (
        await mentorExplanation(
          { ruleId: lesson.id },
          lesson,
          provider,
          'O que é parâmetro?',
        )
      ).text,
    ).toContain('parâmetros');
    expect(await mentorQuiz(lesson, provider)).toEqual(lesson.quiz);
    expect(request.mock.calls[0][1]?.headers).not.toHaveProperty(
      'Authorization',
    );
  });
  it('falha HTTP, rede ou payload inválido retorna lição local', async () => {
    for (const request of [
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('', { status: 503 })),
      vi.fn<typeof fetch>().mockRejectedValue(new Error('timeout')),
      vi.fn<typeof fetch>().mockResolvedValue(new Response('{}')),
    ]) {
      const provider = new OpenAICompatibleProvider(config, request);
      expect(
        (await mentorExplanation({ ruleId: lesson.id }, lesson, provider))
          .source,
      ).toBe('licao');
      expect(await mentorQuiz(lesson, provider)).toEqual(lesson.quiz);
    }
    expect(
      (await mentorExplanation({ ruleId: lesson.id }, lesson)).source,
    ).toBe('licao');
    expect(await mentorQuiz(lesson)).toEqual(lesson.quiz);
  });
  it('não aceita quiz inválido nem lição incompatível', async () => {
    const provider: LLMProvider = {
      explain: async () => '',
      answer: async () => '',
      generateQuiz: async () => [],
    };
    expect(await mentorQuiz(lesson, provider)).toEqual(lesson.quiz);
    await expect(
      mentorExplanation({ ruleId: 'SM002' }, lesson),
    ).rejects.toThrow('corresponder');
    expect(
      await mentorQuiz(
        lesson,
        new OpenAICompatibleProvider(
          config,
          vi.fn<typeof fetch>().mockResolvedValue(response('not json')),
        ),
      ),
    ).toEqual(lesson.quiz);
  });
});
