import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
const shots = resolve(process.cwd(), '../../docs/screenshots');
async function skipTour(page: import('@playwright/test').Page) {
  const skip = page.getByRole('button', { name: 'Pular tour' });
  if (await skip.isVisible()) await skip.click();
}
test('exemplo vulnerável → análise → lição → diff → quiz', async ({ page }) => {
  await page.goto('/analisar');
  await skipTour(page);
  await page.getByRole('button', { name: /SM001.*SQL injection/ }).click();
  await page
    .getByRole('button', { name: 'Analisar código', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: /SQL injection.*SM001/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: /SQL injection.*SM001/ }).click();
  await expect(
    page.getByRole('heading', { name: 'SQL injection', exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Antes e depois' }).click();
  await expect(
    page
      .getByRole('tabpanel', { name: 'Antes e depois' })
      .getByText('DEPOIS · EXEMPLO DIDÁTICO'),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: resolve(shots, 'analisador.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('link', { name: 'Testar o que aprendi' }).click();
  await page.getByRole('button', { name: /Query parametrizada/ }).click();
  await expect(page.getByText('Boa! Você entendeu.')).toBeVisible();
  await page.getByRole('button', { name: 'Ver meu resultado' }).click();
  await expect(page.getByText('Mais um passo à frente.')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(shots, 'quiz.png'), fullPage: true });
});
test('demo de produção, landing e criador de lição', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Seu próximo commit',
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(shots, 'inicio.png'), fullPage: true });
  await page.goto('/demo');
  await expect(page.getByText('1 achado(s)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /03.*Ver a correção/ }).click();
  await expect(
    page
      .getByRole('tabpanel', { name: 'Antes e depois' })
      .getByText('DEPOIS · EXEMPLO DIDÁTICO'),
  ).toBeVisible();
  await page.getByRole('button', { name: /04.*Praticar com quiz/ }).click();
  await expect(
    page.getByText('Qual opção separa dados da instrução SQL?'),
  ).toBeVisible();
  await page.goto('/contribuir');
  await skipTour(page);
  await expect(page.getByText('Lição válida', { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: resolve(shots, 'criador.png'),
    fullPage: true,
    animations: 'disabled',
  });
});
test('mobile 360px, sem overflow, tema e navegação', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(360);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: resolve(shots, 'inicio-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Escuro', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Abrir navegação' }).click();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Analisador', exact: true })
    .click();
  await skipTour(page);
  await expect(
    page.getByRole('heading', { name: 'Descubra. Entenda. Melhore.' }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(360);
});
test('PWA abre biblioteca e demo offline após primeira visita', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.goto('/licoes');
  await skipTour(page);
  await expect(
    page.getByRole('heading', { name: 'Segurança, sem barreira de idioma.' }),
  ).toBeVisible();
  await page.goto('/demo');
  await expect(page.getByText('1 achado(s)', { exact: true })).toBeVisible();
  await context.setOffline(false);
});

test('correção com desfazer, relatório e link privado no fragmento', async ({
  page,
}) => {
  await page.goto('/analisar');
  await skipTour(page);
  await page.getByRole('button', { name: /SM009.*CORS e cookies/ }).click();
  await page
    .getByRole('button', { name: 'Analisar código', exact: true })
    .click();
  await page
    .getByRole('button', { name: /CORS e cookies permissivos.*Linha 2/ })
    .click();
  await page.getByRole('tab', { name: 'Antes e depois' }).click();
  await page
    .getByRole('button', { name: 'Aplicar correção no editor' })
    .click();
  await expect(page.locator('.cm-content')).toContainText('httpOnly: true');
  await page.getByRole('button', { name: 'Desfazer última correção' }).click();
  await expect(page.locator('.cm-content')).toContainText('httpOnly: false');
  await page
    .getByRole('button', { name: 'Analisar código', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Exportar JSON' }),
  ).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar JSON' }).click();
  expect((await downloading).suggestedFilename()).toBe('secmentor.json');
  await page.getByRole('button', { name: 'Criar link do trecho' }).click();
  await page.getByRole('button', { name: 'Entendi, gerar link' }).click();
  const link = await page
    .getByLabel(
      'Link pronto. Copie e compartilhe somente com quem você deseja.',
    )
    .inputValue();
  expect(new URL(link).hash).toContain('codigo=');
  expect(new URL(link).search).toBe('');
  await page.goto(link);
  await expect(page.locator('.cm-content')).toContainText('httpOnly: false');
  await expect(
    page.getByText('2 achado(s)', { exact: true }).first(),
  ).toBeVisible();
});

test('ZIP com múltiplos arquivos, árvore e análise em Worker', async ({
  page,
}) => {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zip.file('src/a.ts', 'eval(input);');
  zip.file('src/b.ts', 'db.query("SELECT * FROM users WHERE id=" + input);');
  await page.goto('/analisar');
  await skipTour(page);
  await page.getByLabel('Abrir ZIP', { exact: true }).setInputFiles({
    name: 'projeto.zip',
    mimeType: 'application/zip',
    buffer: await zip.generateAsync({ type: 'nodebuffer' }),
  });
  await expect(page.getByLabel('Arquivos do projeto')).toContainText(
    'src/a.ts',
  );
  await page
    .getByRole('button', { name: 'Analisar código', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: /SQL injection.*SM001/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Execução dinâmica de código.*SM006/ }),
  ).toBeVisible();
});
