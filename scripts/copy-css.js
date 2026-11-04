import { copyFile, mkdir } from 'node:fs/promises';

await copyFile(
  new URL('../src/wtc-gordito-carousel.css', import.meta.url),
  new URL('../dist/wtc-gordito-carousel.css', import.meta.url),
);
await mkdir(new URL('../dist/react/', import.meta.url), { recursive: true });
await copyFile(
  new URL('../src/react/style.css', import.meta.url),
  new URL('../dist/react/style.css', import.meta.url),
);
