import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['packages/core/**/*.test.ts', 'packages/cli/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'web',
          include: ['packages/playground/src/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['packages/playground/test-setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['packages/core/src/**/*.ts'],
      exclude: ['**/lessons.generated.ts'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { statements: 85, branches: 75, functions: 90, lines: 85 },
    },
  },
});
