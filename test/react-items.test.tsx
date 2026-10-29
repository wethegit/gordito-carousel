// @vitest-environment jsdom

import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  Carousel,
  CarouselItem,
  CarouselList,
  CarouselTrack,
  useCarousel,
} from '../src/react/index.js';
import type { WtcGorditoCarousel, WtcGorditoCarouselOptions } from '../src/wtc-gordito-carousel.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const options = { infinite: true };
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
});

function StatefulItem({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((value) => value + 1)}>{`${label}:${count}`}</button>;
}

function Instance({ capture }: { capture: (carousel: WtcGorditoCarousel | null) => void }) {
  capture(useCarousel().carousel);
  return null;
}

async function render(
  items: readonly ReactNode[],
  props: Partial<WtcGorditoCarouselOptions> = options,
) {
  await act(() => root.render(<Carousel items={items} options={props} />));
}

describe('React items mode', () => {
  it('defaults to a ul track with direct li items, including infinite copies', async () => {
    await render([
      <CarouselItem key="first" className="first" style={{ color: 'red' }}>
        First
      </CarouselItem>,
      <StatefulItem key="second" label="Second" />,
      'Third',
    ]);

    const track = container.querySelector('[data-wtcg-track]')!;
    expect(track.tagName).toBe('UL');
    expect(track.querySelectorAll('[data-wtcg-cloned]').length).toBeGreaterThan(0);
    for (const slide of track.children) {
      expect(slide.tagName).toBe('LI');
      expect(slide.hasAttribute('data-wtcg-slide')).toBe(true);
    }
    for (const item of track.querySelectorAll<HTMLElement>('.first')) {
      expect(item.textContent).toBe('First');
      expect(item.style.color).toBe('red');
      expect(item.querySelector('li')).toBeNull();
    }
  });

  it('supports custom track and item elements', async () => {
    await act(() =>
      root.render(
        <Carousel
          items={[
            <CarouselItem key="first" as="article">
              First
            </CarouselItem>,
          ]}
          trackAs="div"
          options={options}
        />,
      ),
    );

    const track = container.querySelector('[data-wtcg-track]')!;
    expect(track.tagName).toBe('DIV');
    expect([...track.children].every((slide) => slide.tagName === 'ARTICLE')).toBe(true);
  });

  it('supports semantic defaults and overrides in authored structure', async () => {
    await act(() =>
      root.render(
        <Carousel options={options}>
          <CarouselList>
            <CarouselTrack>
              <CarouselItem>First</CarouselItem>
              <CarouselItem>Second</CarouselItem>
            </CarouselTrack>
          </CarouselList>
        </Carousel>,
      ),
    );
    expect(container.querySelector('[data-wtcg-track]')?.tagName).toBe('UL');
    expect(container.querySelector('[data-wtcg-slide]')?.tagName).toBe('LI');

    await act(() =>
      root.render(
        <Carousel options={options}>
          <CarouselList>
            <CarouselTrack as="ol">
              <CarouselItem>First</CarouselItem>
            </CarouselTrack>
          </CarouselList>
        </Carousel>,
      ),
    );
    expect(container.querySelector('[data-wtcg-track]')?.tagName).toBe('OL');
  });

  it('wraps composite items and preserves keyed copy state and current styles', async () => {
    await render([
      <StatefulItem key="first" label="First" />,
      <StatefulItem key="second" label="Second" />,
    ]);

    const copy = container.querySelector<HTMLButtonElement>(
      '[data-wtcg-cloned][data-wtcg-source-index="0"] button',
    )!;
    await act(() => copy.click());
    expect(copy.textContent).toBe('First:1');

    await render([
      <StatefulItem key="first" label="Updated" />,
      <StatefulItem key="second" label="Second" />,
    ]);

    const updatedCopy = container.querySelector<HTMLButtonElement>(
      '[data-wtcg-cloned][data-wtcg-source-index="0"] button',
    )!;
    expect(updatedCopy).toBe(copy);
    expect(updatedCopy.textContent).toBe('Updated:1');

    await render([
      <div key="first" style={{ color: 'green' }}>
        First
      </div>,
      <div key="second">Second</div>,
    ]);
    expect(
      container.querySelector<HTMLElement>(
        '[data-wtcg-slide][data-wtcg-source-index="0"]:not([data-wtcg-cloned])',
      )!.style.color,
    ).toBe('green');
  });

  it('keeps source item identity through selection and rejects runtime filtering', async () => {
    const captured: { current: WtcGorditoCarousel | null } = { current: null };
    const items = [
      <div key="excluded">Excluded</div>,
      <div key="second" className="included">
        Second
      </div>,
      <div key="third" className="included">
        Third
      </div>,
    ];

    await act(() =>
      root.render(
        <Carousel items={items} options={{ infinite: false, slide: '.included' }}>
          <Instance capture={(value) => (captured.current = value)} />
        </Carousel>,
      ),
    );

    expect(
      [...container.querySelectorAll('[data-wtcg-slide]:not([data-wtcg-cloned])')].map((slide) =>
        slide.getAttribute('data-wtcg-source-index'),
      ),
    ).toEqual(['1', '2']);

    expect(() => captured.current?.filterSlides('.included')).toThrow(
      'filterSlides is not supported with externally rendered slides.',
    );
  });

  it('recreates the instance when generated structure elements change', async () => {
    const captured: { current: WtcGorditoCarousel | null } = { current: null };
    const items = [<div key="first">First</div>];
    const capture = (value: WtcGorditoCarousel | null) => (captured.current = value);

    await act(() =>
      root.render(
        <Carousel items={items} options={options} listAs="div" trackAs="div">
          <Instance capture={capture} />
        </Carousel>,
      ),
    );
    const previous = captured.current;

    await act(() =>
      root.render(
        <Carousel items={items} options={options} listAs="article" trackAs="ul">
          <Instance capture={capture} />
        </Carousel>,
      ),
    );

    expect(captured.current).not.toBe(previous);
    expect(captured.current?.list.tagName).toBe('ARTICLE');
    expect(captured.current?.track.tagName).toBe('UL');
    expect(captured.current?.track.isConnected).toBe(true);
  });
});
