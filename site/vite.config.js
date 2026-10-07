import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demosDir = resolve(repoRoot, 'demos');
const srcDir = resolve(repoRoot, 'src');

/*
 * The standalone demos in /demos are written for CodePen, so they load the
 * published package from CDNs. On the site they should run against this repo's
 * source instead, without keeping a second copy of each demo:
 *
 * - CDN imports in demo JS and CSS are rewritten to the local source.
 * - `<!-- demo:name -->` in a site page is replaced with the body of
 *   demos/name/index.html.
 */
function standaloneDemos() {
  const cdnImports = [
    ['https://esm.sh/@wethegit/gordito-carousel@1', 'index.ts'],
    [
      'https://cdn.jsdelivr.net/npm/@wethegit/gordito-carousel@1/dist/wtc-gordito-carousel.css',
      'wtc-gordito-carousel.css',
    ],
  ];

  return {
    name: 'standalone-demos',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0];
      if (!file.startsWith(demosDir)) return null;

      const local = cdnImports.reduce((result, [url, source]) => {
        const path = relative(dirname(file), resolve(srcDir, source)).replaceAll('\\', '/');
        return result.replaceAll(url, path);
      }, code);

      // Demo scripts run for their side effects, but the package's `sideEffects`
      // field covers /demos too and would otherwise tree-shake them away.
      return { code: local, moduleSideEffects: true };
    },
    transformIndexHtml(html) {
      return html.replace(/<!--\s*demo:([\w-]+)\s*-->/g, (_, name) => {
        const demo = readFileSync(resolve(demosDir, name, 'index.html'), 'utf8');
        const body = demo.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? '';
        return body.replace(/<!--\s*CodePen:.*?-->/, '').trim();
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  root: 'site',
  base: command === 'build' ? '/gordito-carousel/' : '/',
  plugins: [standaloneDemos(), react()],
  build: {
    outDir: 'site-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(repoRoot, 'site/index.html'),
        'path-carousel': resolve(repoRoot, 'site/path-carousel/index.html'),
        'split-flap': resolve(repoRoot, 'site/split-flap/index.html'),
      },
    },
  },
  server: { open: true },
}));
