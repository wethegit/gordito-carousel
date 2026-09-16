import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ command }) => ({
  root: 'site',
  base: command === 'build' ? '/gordito-carousel/' : '/',
  plugins: [react()],
  build: { outDir: 'site-dist', emptyOutDir: true },
  server: { open: true },
}));
