import { copyFile } from 'node:fs/promises';

await copyFile(
  new URL('../src/wtc-gordito-carousel.css', import.meta.url),
  new URL('../dist/wtc-gordito-carousel.css', import.meta.url),
);
