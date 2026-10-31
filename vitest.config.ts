import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['packages/**/*.test.ts'], coverage: { provider: 'v8', include: ['packages/core/src/**/*.ts'], exclude: ['**/lessons.generated.ts'], reporter: ['text', 'html', 'json-summary'], thresholds: { statements: 85, branches: 75, functions: 90, lines: 85 } } } });
