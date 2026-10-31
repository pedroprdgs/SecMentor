import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { lessons } from '@secmentor/core/content';
function spaFallback(base: string): Plugin {
  return {
    name: 'secmentor-spa-pages',
    async closeBundle() {
      const dist = resolve(import.meta.dirname, 'dist');
      const index = await readFile(resolve(dist, 'index.html'), 'utf8');
      // Pages precisa de um arquivo por rota para responder HTTP 200 no primeiro F5.
      const routes = [
        'analisar',
        'licoes',
        'quiz',
        'progresso',
        'contribuir',
        'configuracoes',
        'sobre',
        'demo',
        ...lessons.map((lesson) => `licoes/${lesson.id}`),
      ];
      for (const route of routes) {
        const directory = resolve(dist, route);
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, 'index.html'), index);
      }
      await writeFile(
        resolve(dist, '404.html'),
        index.replace(
          '<head>',
          `<head><script>sessionStorage.setItem('secmentor-spa-redirect',location.pathname+location.search+location.hash);location.replace(${JSON.stringify(base)});</script>`,
        ),
      );
    },
  };
}
export default defineConfig(() => {
  const base = process.env.VITE_BASE_PATH || '/';
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
        manifest: {
          name: 'SecMentor — segurança se aprende',
          short_name: 'SecMentor',
          description: 'Aprenda segurança de código em português, localmente.',
          lang: 'pt-BR',
          theme_color: '#426b23',
          background_color: '#f6f7f1',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png}'],
          maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          navigateFallback: base + 'index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
      spaFallback(base),
    ],
    base,
    define: { 'process.env.BABEL_TYPES_8_BREAKING': 'false' },
    build: { target: 'es2022' },
    worker: { format: 'es' as const },
  };
});
