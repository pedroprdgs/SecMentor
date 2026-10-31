import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  define: { 'process.env.BABEL_TYPES_8_BREAKING': 'false' },
});
