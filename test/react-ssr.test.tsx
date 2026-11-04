// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Carousel, CarouselItem, CarouselNext } from '../src/react/index.js';

afterEach(() => vi.restoreAllMocks());

it('renders source items on the server without DOM access or layout-effect warnings', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  expect(typeof window).toBe('undefined');
  const html = renderToString(
    <Carousel
      aria-label="Server-rendered carousel"
      options={{ infinite: true }}
      items={[
        <CarouselItem key="first">First</CarouselItem>,
        <CarouselItem key="second">Second</CarouselItem>,
      ]}
    >
      <CarouselNext>Next</CarouselNext>
    </Carousel>,
  );

  expect(html).toContain('Server-rendered carousel');
  expect(html).toContain('First');
  expect(html).toContain('Second');
  expect(html).toContain('data-wtcg-next');
  expect(html.match(/data-wtcg-slide=/g)).toHaveLength(2);
  expect(html).not.toContain('data-wtcg-initialized');
  expect(html).not.toContain('data-wtcg-cloned');
  expect(error).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
});
