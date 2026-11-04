// @vitest-environment jsdom

import {
  act,
  StrictMode,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Carousel,
  CarouselItem,
  useCarousel,
  type CarouselContextValue,
  type CarouselProps,
} from '../src/react/index.js';
import type { WtcGorditoCarousel } from '../src/wtc-gordito-carousel.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const options = { infinite: true };
const runtimeProperties = [
  '--wtcg-slide-index',
  '--wtcg-slide-render-index',
  '--wtcg-slide-offset',
  '--wtcg-slide-distance',
  '--wtcg-slide-side',
];
let container: HTMLDivElement;
let root: Root;
let context: CarouselContextValue | null;

beforeEach(() => {
  vi.useFakeTimers();
  context = null;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function Capture() {
  const value = useCarousel();
  useLayoutEffect(() => {
    context = value;
  }, [value]);
  return null;
}

function instance(): WtcGorditoCarousel {
  expect(context?.carousel).not.toBeNull();
  return context!.carousel!;
}

async function render(items: readonly ReactNode[], props: Omit<CarouselProps, 'items'> = {}) {
  await act(() =>
    root.render(
      <Carousel options={options} {...props} items={items}>
        <Capture />
      </Carousel>,
    ),
  );
}

function StatefulContent({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((value) => value + 1)}>{`${label}:${count}`}</button>;
}

function styledItems(updated: boolean) {
  const style: CSSProperties & Record<string, string | number | undefined> = {
    color: updated ? 'blue' : 'red',
    padding: updated ? undefined : '2px',
    borderWidth: '3px',
    '--author': updated ? 'updated' : 'original',
    '--wtcg-slide-custom': 'keep',
  };
  return [
    <CarouselItem key="styled" style={style}>
      Styled
    </CarouselItem>,
    <CarouselItem key="other">Other</CarouselItem>,
  ];
}

function Composite({ onClick, version }: { onClick: () => void; version: string }) {
  return (
    <button data-content="composite" onClick={onClick}>
      composite:{version}
    </button>
  );
}

function mixedItems(version: string, click: (version: string, label: string) => void) {
  const content = (label: string) => ({
    'data-content': label,
    onClick: () => click(version, label),
    children: `${label}:${version}`,
  });
  return [
    <div key="div" {...content('div')} />,
    <button key="button" {...content('button')} />,
    <li key="li" {...content('li')} />,
    <CarouselItem key="item" {...content('item')} />,
    <CarouselItem key="article" as="article" {...content('article')} />,
    <Composite key="composite" version={version} onClick={() => click(version, 'composite')} />,
  ];
}

function expectSources(carousel: WtcGorditoCarousel, sources: number[]) {
  expect(carousel.slideCount).toBe(sources.length);
  expect(carousel.pendingRenderPlan).toBeNull();
  expect(carousel.originalSlides.map((slide) => Number(slide.dataset.wtcgSourceIndex))).toEqual(
    sources,
  );
  expect(carousel.allSlides).toHaveLength(sources.length + 2 * carousel.cloneCount);
  for (const slide of carousel.allSlides) {
    const index = Number(slide.dataset.wtcgIndex);
    const source = sources[((index % sources.length) + sources.length) % sources.length];
    expect(slide.dataset.wtcgSourceIndex).toBe(String(source));
    expect(slide.hasAttribute('data-wtcg-cloned')).toBe(index < 0 || index >= sources.length);
  }
}

describe('React items regressions', () => {
  it.each([
    { infinite: false, itemRoot: 'CarouselItem', strict: false },
    { infinite: true, itemRoot: 'CarouselItem', strict: false },
    { infinite: false, itemRoot: 'li', strict: false },
    { infinite: true, itemRoot: 'li', strict: false },
    { infinite: true, itemRoot: 'CarouselItem', strict: true },
  ])(
    'expands stable keyed selectors ($itemRoot, infinite=$infinite, strict=$strict)',
    async ({ infinite, itemRoot, strict }) => {
      const Item = itemRoot === 'li' ? 'li' : CarouselItem;
      const items = ['A', 'B', 'C'].map((label) => (
        <Item key={label} className={`all ${label === 'A' ? 'excluded' : 'included'}`}>
          <StatefulContent label={label} />
        </Item>
      ));
      const renderSelector = async (slide?: string) => {
        const carousel = (
          <Carousel items={items} options={{ infinite, slide }}>
            <Capture />
          </Carousel>
        );
        await act(() => root.render(strict ? <StrictMode>{carousel}</StrictMode> : carousel));
      };

      await renderSelector('.included');
      expectSources(instance(), [1, 2]);
      const [originalB, originalC] = instance().originalSlides;
      const leadingC = instance().track.querySelector<HTMLElement>(
        ':scope > [data-wtcg-cloned][data-wtcg-index="-1"]',
      );
      if (infinite) {
        expect(leadingC?.dataset.wtcgSourceIndex).toBe('2');
        await act(() => leadingC!.querySelector('button')!.click());
        expect(leadingC?.textContent).toBe('C:1');
        expect(originalC?.textContent).toBe('C:0');
      }

      for (const selector of ['.all', undefined]) {
        await renderSelector('.included');
        expectSources(instance(), [1, 2]);
        await renderSelector(selector);
        expectSources(instance(), [0, 1, 2]);
        expect(instance().originalSlides[1]).toBe(originalB);
        expect(instance().originalSlides[2]).toBe(originalC);
        expect(instance().originalSlides.map((slide) => slide.textContent)).toEqual([
          'A:0',
          'B:0',
          'C:0',
        ]);
        if (infinite) {
          expect(
            instance().track.querySelector(':scope > [data-wtcg-cloned][data-wtcg-index="-1"]'),
          ).toBe(leadingC);
          expect(leadingC?.textContent).toBe('C:1');
        }
      }

      await renderSelector('.included');
      expectSources(instance(), [1, 2]);
      await renderSelector('.excluded');
      expectSources(instance(), [0]);
      expect(instance().originalSlides[0]?.textContent).toBe('A:0');
    },
  );

  it.each([
    { initialInfinite: true, nextInfinite: true },
    { initialInfinite: false, nextInfinite: true },
    { initialInfinite: true, nextInfinite: false },
  ])(
    'preserves React style updates across options replacement ($initialInfinite -> $nextInfinite)',
    async ({ initialInfinite, nextInfinite }) => {
      const styledSlides = () =>
        instance().allSlides.filter((slide) => slide.dataset.wtcgSourceIndex === '0');
      const expectAuthorStyles = () => {
        for (const slide of styledSlides()) {
          expect(slide.style.color).toBe('blue');
          expect(slide.style.padding).toBe('');
          expect(slide.style.borderWidth).toBe('3px');
          expect(slide.style.getPropertyValue('--author')).toBe('updated');
          expect(slide.style.getPropertyValue('--wtcg-slide-custom')).toBe('keep');
        }
      };
      const expectCleanSnapshot = () => {
        const snapshot = document.createElement('li');
        snapshot.style.cssText = original!.getAttribute('data-wtcg-original-style')!;
        expect(snapshot.style.color).toBe('blue');
        expect(snapshot.style.padding).toBe('');
        expect(snapshot.style.borderWidth).toBe('3px');
        expect(snapshot.style.getPropertyValue('--author')).toBe('updated');
        expect(snapshot.style.getPropertyValue('--wtcg-slide-custom')).toBe('keep');
        for (const property of runtimeProperties) {
          expect(snapshot.style.getPropertyValue(property)).toBe('');
        }
      };

      await render(styledItems(false), {
        options: { infinite: initialInfinite },
      });
      const previous = instance();
      const original = previous.originalSlides[0];
      expect(original?.style.color).toBe('red');
      if (initialInfinite) expect(styledSlides().length).toBeGreaterThan(1);
      expect(
        runtimeProperties.every((property) => original!.style.getPropertyValue(property)),
      ).toBe(true);

      await render(styledItems(true), { options: { infinite: nextInfinite } });
      expect(instance()).not.toBe(previous);
      expect(instance().originalSlides[0]).toBe(original);
      expectSources(instance(), [0, 1]);
      if (nextInfinite) expect(styledSlides().length).toBeGreaterThan(1);
      expectAuthorStyles();
      expectCleanSnapshot();

      await act(() => instance().refresh());
      expectSources(instance(), [0, 1]);
      expectAuthorStyles();
      expectCleanSnapshot();

      const slides = instance().allSlides;
      await act(() => instance().destroy());
      expectAuthorStyles();
      for (const slide of slides) {
        expect(slide.hasAttribute('data-wtcg-original-style')).toBe(false);
        for (const property of runtimeProperties) {
          expect(slide.style.getPropertyValue(property)).toBe('');
        }
      }
    },
  );

  it.each([undefined, 'ol'] as const)(
    'keeps list slides as direct li roots with current content and handlers (trackAs=%s)',
    async (trackAs) => {
      const labels = ['div', 'button', 'li', 'item', 'article', 'composite'];
      const firstClick = vi.fn();
      await render(mixedItems('first', firstClick), { trackAs });
      const originals = instance().originalSlides;
      const copies = instance().allSlides.filter((slide) => slide.hasAttribute('data-wtcg-cloned'));
      expect(copies.length).toBeGreaterThan(0);
      expect(instance().track.tagName).toBe(trackAs === 'ol' ? 'OL' : 'UL');

      const checkContent = async (version: string, click: ReturnType<typeof vi.fn>) => {
        expectSources(instance(), [0, 1, 2, 3, 4, 5]);
        const expectedCalls: string[][] = [];
        for (const slide of instance().allSlides) {
          const source = Number(slide.dataset.wtcgSourceIndex);
          const label = labels[source]!;
          expect(slide.parentElement).toBe(instance().track);
          expect(slide.tagName).toBe('LI');
          expect(slide.querySelector('li')).toBeNull();
          const target =
            source === 2 || source === 3
              ? slide
              : slide.querySelector<HTMLElement>('[data-content]')!;
          expect(target.dataset.content).toBe(label);
          expect(target.textContent).toBe(`${label}:${version}`);
          if (source !== 2 && source !== 3) {
            expect(slide.firstElementChild).toBe(target);
            expect(target.tagName).toBe(source === 0 ? 'DIV' : source === 4 ? 'ARTICLE' : 'BUTTON');
          }
          await act(() => target.click());
          expectedCalls.push([version, label]);
        }
        expect(click.mock.calls).toEqual(expectedCalls);
        for (const source of [0, 1]) {
          expect(copies.some((slide) => slide.dataset.wtcgSourceIndex === String(source))).toBe(
            true,
          );
        }
      };
      await checkContent('first', firstClick);
      firstClick.mockClear();

      const currentClick = vi.fn();
      await render(mixedItems('current', currentClick), { trackAs });
      instance().originalSlides.forEach((slide, index) => expect(slide).toBe(originals[index]));
      await checkContent('current', currentClick);
      expect(firstClick).not.toHaveBeenCalled();
    },
  );

  it('keeps raw intrinsic roots on non-list tracks, including interactive copies', async () => {
    const click = vi.fn();
    await render(
      [
        <div key="div" onClick={() => click('div')}>
          Div
        </div>,
        <button key="button" onClick={() => click('button')}>
          Button
        </button>,
      ],
      { trackAs: 'div' },
    );

    expectSources(instance(), [0, 1]);
    expect(instance().cloneCount).toBeGreaterThan(0);
    for (const slide of instance().allSlides) {
      const isDiv = slide.dataset.wtcgSourceIndex === '0';
      expect(slide.tagName).toBe(isDiv ? 'DIV' : 'BUTTON');
      expect(slide.children).toHaveLength(0);
      await act(() => slide.click());
      expect(click).toHaveBeenLastCalledWith(isDiv ? 'div' : 'button');
    }
    expect(click).toHaveBeenCalledTimes(instance().allSlides.length);
  });

  it('blocks hook swipes synchronously while a refresh plan awaits React commit', async () => {
    const before = vi.fn();
    const after = vi.fn();
    const swipe = vi.fn();
    await render([<CarouselItem key="a">A</CarouselItem>, <CarouselItem key="b">B</CarouselItem>], {
      onBeforeChange: before,
      onAfterChange: after,
    });
    await act(() => vi.runAllTimers());
    const carousel = instance();
    const hookSwipe = context!.swipe;
    carousel.slider.addEventListener('wtcg:swipe', swipe);
    const current = carousel.currentSlide;

    await act(() => {
      carousel.refresh();
      expect(carousel.pendingRenderPlan).not.toBeNull();
      expect(carousel.enabled).toBe(true);
      hookSwipe('next');
      expect(carousel.currentSlide).toBe(current);
      expect(swipe).not.toHaveBeenCalled();
      expect(before).not.toHaveBeenCalled();
      expect(after).not.toHaveBeenCalled();
    });

    expect(carousel.pendingRenderPlan).toBeNull();
    await act(() => vi.runAllTimers());
    expect(carousel.currentSlide).toBe(current);
    expect(swipe).not.toHaveBeenCalled();
    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();

    await act(() => hookSwipe('next'));
    await act(() => vi.runAllTimers());
    expect(carousel.currentSlide).toBe(current + 1);
    expect(context!.currentSlide).toBe(current + 1);
    expect(swipe).toHaveBeenCalledTimes(1);
    expect(before).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('rejects imperative removal before DOM mutation, then reconciles declarative removal', async () => {
    const items = ['A', 'B', 'C'].map((label) => <CarouselItem key={label}>{label}</CarouselItem>);
    await render(items);
    const carousel = instance();
    const markup = carousel.slider.outerHTML;
    const children = [...carousel.track.childNodes];
    const [originalA, , originalC] = carousel.originalSlides;
    const destroy = vi.spyOn(carousel, 'destroy');

    expect(() => carousel.removeSlide(1)).toThrow(
      'removeSlide is not supported with externally rendered slides.',
    );
    expect(carousel.slider.outerHTML).toBe(markup);
    carousel.track.childNodes.forEach((child, index) => expect(child).toBe(children[index]));
    expect(carousel.track.childNodes).toHaveLength(children.length);
    expect(destroy).not.toHaveBeenCalled();
    expect(carousel.enabled).toBe(true);

    await expect(render(items.filter((_, index) => index !== 1))).resolves.toBeUndefined();
    expect(instance()).toBe(carousel);
    expectSources(carousel, [0, 1]);
    expect(carousel.originalSlides[0]).toBe(originalA);
    expect(carousel.originalSlides[1]).toBe(originalC);
    expect(carousel.originalSlides.map((slide) => slide.textContent)).toEqual(['A', 'C']);
    expect(carousel.allSlides.every((slide) => slide.textContent !== 'B')).toBe(true);
  });
});
