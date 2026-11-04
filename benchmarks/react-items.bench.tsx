// @vitest-environment jsdom

import { act, createElement, type ElementType, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterAll, beforeAll, test } from 'vitest';
import { Carousel } from '../src/react/index.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const options = { infinite: true };
const container = document.createElement('div');
const root = createRoot(container);
let update = 0;

function Card({ children }: { children: ReactNode }) {
  return <article>{children}</article>;
}

const cases: {
  name: string;
  listAs: ElementType;
  trackAs: ElementType;
  items: (update: number) => ReactNode[];
}[] = [
  {
    name: 'div structure with intrinsic items',
    listAs: 'div',
    trackAs: 'div',
    items: (value) =>
      Array.from({ length: 12 }, (_, index) =>
        createElement('div', { key: index, style: { opacity: value % 2 ? 1 : 0.9 } }, index),
      ),
  },
  {
    name: 'semantic list with reordered items',
    listAs: 'nav',
    trackAs: 'ul',
    items: (value) =>
      Array.from({ length: 12 }, (_, index) => (
        <li key={index}>{value % 2 ? index : 11 - index}</li>
      )),
  },
  {
    name: 'custom component items with content updates',
    listAs: 'section',
    trackAs: 'div',
    items: (value) =>
      Array.from({ length: 12 }, (_, index) => <Card key={index}>{`${index}:${value % 10}`}</Card>),
  },
];

beforeAll(() => document.body.append(container));
afterAll(async () => {
  await act(() => root.unmount());
  container.remove();
});

for (const benchmark of cases) {
  test(benchmark.name, async ({ bench }) => {
    await bench(benchmark.name, async () => {
      update += 1;
      await act(() =>
        root.render(
          <Carousel
            items={benchmark.items(update)}
            listAs={benchmark.listAs}
            trackAs={benchmark.trackAs}
            options={options}
          />,
        ),
      );
    }).run();
  });
}
