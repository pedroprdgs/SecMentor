import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { lessons } from '../../core/dist/content.js';

const evidence = '/tmp/secmentor-release-evidence';
async function skipTour(page: Page) {
  const skip = page.getByRole('button', { name: 'Pular tour' });
  if (await skip.isVisible()) await skip.click();
}

for (let run = 1; run <= 5; run++) {
  test(`release: demo automática com cache limpo ${run}/5`, async ({
    page,
    context,
  }) => {
    const failures: string[] = [];
    const external: string[] = [];
    page.on('pageerror', (error) => failures.push(error.message));
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type()))
        failures.push(message.text());
    });
    context.on('request', (request) => {
      if (
        !request.url().startsWith('http://127.0.0.1:4173/') &&
        !request.url().startsWith('data:')
      )
        external.push(request.url());
    });
    await page.goto('/demo');
    await expect(page.getByText('1 achado(s)', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('tabpanel', { name: 'Entenda o risco' }),
    ).toBeVisible();
    await expect(
      page.getByRole('tabpanel', { name: 'Antes e depois' }),
    ).toBeVisible();
    await expect(
      page.getByText('Qual opção separa dados da instrução SQL?'),
    ).toBeVisible();
    await page.getByRole('button', { name: /Query parametrizada/ }).click();
    await expect(page.getByText('Boa! Você entendeu.')).toBeVisible();
    await page.getByRole('button', { name: 'Ver meu resultado' }).click();
    await expect(page.getByText('Mais um passo à frente.')).toBeVisible();
    expect(external).toEqual([]);
    expect(failures).toEqual([]);
  });
}

test('release: YAML, JSON, SARIF e PDF gerados e abertos', async ({ page }) => {
  await mkdir(resolve(evidence, 'lessons'), { recursive: true });
  await page.goto('/contribuir');
  await skipTour(page);
  const yamlDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar YAML', exact: true }).click();
  const yaml = await yamlDownload;
  await yaml.saveAs(resolve(evidence, 'lessons/SM001.yaml'));
  expect(
    await readFile(resolve(evidence, 'lessons/SM001.yaml'), 'utf8'),
  ).toContain('id: SM001');
  await page.goto('/analisar');
  await page.getByRole('button', { name: /SM001.*SQL injection/ }).click();
  await page
    .getByRole('button', { name: 'Analisar código', exact: true })
    .click();
  await expect(page.locator('.finding')).toHaveCount(1);
  await expect(page.locator('.cm-lintRange-error')).toHaveCount(1);
  for (const format of ['JSON', 'SARIF']) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: `Exportar ${format}` }).click();
    const file = await pending;
    const path = resolve(evidence, `resultado.${format.toLowerCase()}`);
    await file.saveAs(path);
    const parsed = JSON.parse(await readFile(path, 'utf8'));
    if (format === 'JSON') expect(parsed.findings[0].ruleId).toBe('SM001');
    else {
      expect(parsed.version).toBe('2.1.0');
      expect(parsed.runs[0].results[0].ruleId).toBe('SM001');
    }
  }
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-only')).toBeVisible();
  await expect(page.locator('.print-only')).toContainText(
    lessons[0].por_que_e_perigoso,
  );
  const pdf = await page.pdf({
    path: resolve(evidence, 'relatorio.pdf'),
    format: 'A4',
    printBackground: true,
  });
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(10000);
});

test('release: entradas inválidas e projeto grande com UI responsiva', async ({
  page,
}) => {
  await page.goto('/analisar');
  await skipTour(page);
  await page
    .getByRole('button', { name: 'Analisar código', exact: true })
    .click();
  await expect(
    page.getByText('Seu código passou nas verificações do SecMentor', {
      exact: false,
    }),
  ).toBeVisible();
  const files = page.locator('input[type=file]').first();
  await files.setInputFiles({
    name: 'grande.ts',
    mimeType: 'text/plain',
    buffer: Buffer.alloc(1048577, 120),
  });
  await expect(page.locator('.notice')).toContainText(
    /limite|Limite|excede|excedeu/,
  );
  await files.setInputFiles({
    name: 'binario.ts',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from([0, 1, 2, 0]),
  });
  await expect(page.locator('.notice')).toContainText(
    'Alguns arquivos não suportados foram ignorados.',
  );
  await files.setInputFiles({
    name: 'codigo.py',
    mimeType: 'text/plain',
    buffer: Buffer.from('print(1)'),
  });
  await expect(page.locator('.notice')).toContainText(
    'Alguns arquivos não suportados foram ignorados.',
  );
  await page
    .locator('input[type=file]')
    .nth(2)
    .setInputFiles({
      name: 'ruim.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('corrompido'),
    });
  await expect(page.locator('.notice')).toContainText(/ZIP/);
  await files.setInputFiles(
    Array.from({ length: 1501 }, (_, i) => ({
      name: `a${i}.ts`,
      mimeType: 'text/plain',
      buffer: Buffer.from('eval(input)'),
    })),
  );
  await expect(page.locator('.notice')).toContainText(
    /limite|Limite|excede|excedeu/,
  );
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (let i = 0; i < 1000; i++)
    zip.file(`src/a${i}.ts`, 'const valor = 1;\n'.repeat(50));
  await page
    .locator('input[type=file]')
    .nth(2)
    .setInputFiles({
      name: 'grande.zip',
      mimeType: 'application/zip',
      buffer: await zip.generateAsync({ type: 'nodebuffer' }),
    });
  await page.evaluate(() => {
    const state = { ticks: 0 };
    Object.assign(window, { releaseHeartbeat: state });
    const pulse = () => {
      state.ticks++;
      requestAnimationFrame(pulse);
    };
    requestAnimationFrame(pulse);
  });
  await page
    .getByRole('button', { name: 'Analisar código', exact: true })
    .click();
  await expect(page.locator('.scan-progress')).toBeVisible();
  await expect(page.locator('.result-footer')).toContainText('1000 arquivo(s)');
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { releaseHeartbeat: { ticks: number } })
          .releaseHeartbeat.ticks,
    ),
  ).toBeGreaterThan(1);
  console.log(
    'RELEASE_LARGE_PROJECT:',
    await page.locator('.result-footer').innerText(),
  );
});

test('release: quiz certo e errado, progresso, configurações e apagar dados', async ({
  page,
}) => {
  await page.goto('/quiz?licao=SM001');
  await skipTour(page);
  const correct = 'Query parametrizada';
  await page
    .locator('.quiz-options button')
    .filter({ hasNotText: correct })
    .first()
    .click();
  await expect(page.getByText('Ainda não. Veja o porquê.')).toBeVisible();
  await page.goto('/quiz?licao=SM001');
  await page.getByRole('button', { name: new RegExp(correct) }).click();
  await expect(page.getByText('Boa! Você entendeu.')).toBeVisible();
  await page.goto('/progresso');
  await expect(page.locator('.stat').nth(1)).toContainText('20');
  await expect(page.getByText('Primeiro passo', { exact: true })).toBeVisible();
  await expect(page.locator('.completed-lessons')).toContainText('SM001');
  await page.goto('/configuracoes');
  await page
    .getByRole('combobox', { name: 'Tema', exact: true })
    .selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page
    .getByRole('combobox', { name: 'Tema', exact: true })
    .selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('/progresso');
  await page.getByRole('button', { name: 'Apagar meus dados' }).click();
  await page.getByRole('button', { name: 'Apagar dados do SecMentor' }).click();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith('secmentor-web-'),
      ),
    ),
  ).toEqual([]);
});

test('release: todas as lições, layouts, teclado e console', async ({
  page,
}) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type()))
      failures.push(message.text());
  });
  const routes = [
    '/',
    '/analisar',
    '/licoes',
    '/quiz',
    '/progresso',
    '/contribuir',
    '/configuracoes',
    '/sobre',
    ...lessons.map((lesson) => `/licoes/${lesson.id}`),
  ];
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await skipTour(page);
      await expect(page.locator('main h1')).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
      const text = await page.locator('main').innerText();
      expect(text).not.toMatch(/\bundefined\b|\bnull\b|lorem ipsum|FIXME|TODO/);
      expect(
        await page
          .locator('img')
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0,
            ),
          ),
      ).toBe(true);
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(() => document.activeElement?.tagName),
      ).not.toBe('BODY');
    }
  }
  await page.goto('/licoes/SM001');
  await page.getByRole('tab', { name: 'Entenda o risco' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Antes e depois' })).toBeFocused();
  await expect(
    page.getByRole('tabpanel', { name: 'Antes e depois' }),
  ).toBeVisible();
  expect(failures).toEqual([]);
});

for (const mode of ['inexistente', 'lento']) {
  test(`release: IA ${mode}, consentimento, destino e fallback`, async ({
    page,
  }) => {
    const requests: { url: string; body: string; key?: string }[] = [];
    await page.route('https://tutor.invalid/**', async (route) => {
      const request = route.request();
      requests.push({
        url: request.url(),
        body: request.postData() ?? '',
        key: request.headers().authorization,
      });
      if (mode === 'lento')
        await new Promise((resolve) => setTimeout(resolve, 9000));
      await route.abort().catch(() => {});
    });
    await page.goto('/configuracoes');
    await skipTour(page);
    await page.getByLabel('Ativar IA', { exact: true }).check();
    await page
      .getByLabel('Base URL', { exact: false })
      .fill('https://tutor.invalid/v1');
    await page.getByLabel('Modelo', { exact: true }).fill('modelo-de-teste');
    await page
      .getByLabel('API key', { exact: false })
      .fill('chave-ficticia-qa');
    await page.getByRole('button', { name: 'Salvar configurações' }).click();
    await page.goto('/licoes/SM001');
    await page.getByRole('button', { name: 'Explicar de outro jeito' }).click();
    await expect(page.getByRole('dialog')).toContainText(
      'O arquivo e o trecho do editor não serão enviados',
    );
    expect(requests).toEqual([]);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Confirmar|Enviar/ })
      .click();
    await expect(page.getByText('Lição local · IA indisponível')).toBeVisible({
      timeout: 12000,
    });
    await expect(page.locator('.ai-answer')).toContainText(
      lessons[0].por_que_e_perigoso,
    );
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('https://tutor.invalid/v1/chat/completions');
    expect(requests[0].key).toBe('Bearer chave-ficticia-qa');
    expect(requests[0].body).not.toContain('chave-ficticia-qa');
    expect(JSON.parse(requests[0].body).messages[1].content).not.toContain(
      'snippet',
    );
  });
}
