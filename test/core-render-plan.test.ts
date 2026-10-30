// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WtcGorditoCarousel, type WtcGorditoCarouselOptions } from '../src/wtc-gordito-carousel.js';

const runtimeProperties = [
  '--wtcg-slide-index',
  '--wtcg-slide-render-index',
  '--wtcg-slide-offset',
  '--wtcg-slide-distance',
  '--wtcg-slide-side',
];
let carousels: WtcGorditoCarousel[];

beforeEach(() => {
  vi.useFakeTimers();
  carousels = [];
});

afterEach(() => {
  carousels.forEach((carousel) => carousel.destroy());
  document.body.replaceChildren();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function createCarousel(options: Partial<WtcGorditoCarouselOptions> = {}) {
  const slider = document.createElement('section');
  slider.innerHTML = `
    <div data-wtcg-list>
      <ul data-wtcg-track>
        <li data-wtcg-slide data-wtcg-source-index="0" style="color: red; padding: 2px; --author: original">First</li>
        <li data-wtcg-slide data-wtcg-source-index="1">Second</li>
        <li data-wtcg-slide data-wtcg-source-index="2">Third</li>
      </ul>
    </div>`;
  document.body.append(slider);
  const list = slider.querySelector<HTMLElement>('[data-wtcg-list]')!;
  vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 300, 100));
  Object.defineProperties(list, {
    setPointerCapture: { value: vi.fn() },
    releasePointerCapture: { value: vi.fn() },
  });
  const carousel = new WtcGorditoCarousel(slider, options);
  carousels.push(carousel);
  return carousel;
}

// Simulate a renderer committing its plan while retaining original slide nodes.
function commitPlan(carousel: WtcGorditoCarousel) {
  const plan = carousel.pendingRenderPlan!;
  expect(plan).not.toBeNull();
  const existing = carousel.allSlides;
  const slides = plan.slides.map((item) => {
    const source = carousel.originalSlides[item.sourceIndex]!;
    const slide = item.isClone
      ? (existing.find(
          (candidate) =>
            candidate.hasAttribute('data-wtcg-cloned') &&
            candidate.getAttribute('data-wtcg-index') === String(item.index),
        ) ?? (source.cloneNode(true) as HTMLElement))
      : source;
    slide.setAttribute('data-wtcg-index', String(item.index));
    slide.setAttribute('data-wtcg-source-index', String(item.sourceIndex));
    slide.toggleAttribute('data-wtcg-cloned', item.isClone);
    return slide;
  });
  carousel.track.replaceChildren(...slides);
  expect(carousel.commitRenderPlan(plan.id)).toBe(true);
  vi.runAllTimers();
}

function watchChanges(carousel: WtcGorditoCarousel) {
  const before = vi.fn();
  const after = vi.fn();
  const swipe = vi.fn();
  carousel.slider.addEventListener('wtcg:beforeChange', before);
  carousel.slider.addEventListener('wtcg:afterChange', after);
  carousel.slider.addEventListener('wtcg:swipe', swipe);
  return { before, after, swipe };
}

function dispatchPointer(carousel: WtcGorditoCarousel, type: string, clientX: number) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX,
    clientY: 10,
  });
  Object.defineProperties(event, {
    isPrimary: { value: true },
    pointerId: { value: 1 },
  });
  carousel.list.dispatchEvent(event);
}

describe('external render-plan mutation guards', () => {
  it.each([false, true])('rejects mutations before touching DOM (committed=%s)', (committed) => {
    const onRenderPlan = vi.fn();
    const carousel = createCarousel({ onRenderPlan });
    if (committed) commitPlan(carousel);
    const destroy = vi.spyOn(carousel, 'destroy');
    const added = document.createElement('article');
    added.textContent = 'Added';
    const markup = carousel.slider.outerHTML;
    const children = [...carousel.track.children];
    const originals = carousel.originalSlides;
    const plan = carousel.pendingRenderPlan;
    const eventController = carousel.eventController;
    const mutations = [
      ['addSlide', () => carousel.addSlide(added, 0, true)],
      ['addSlide', () => carousel.addSlide('<article>Added</article>')],
      ['removeSlide', () => carousel.removeSlide(0)],
      ['removeSlide', () => carousel.removeSlide(1, true)],
      ['removeSlide', () => carousel.removeSlide(0, false, true)],
      ['filterSlides', () => carousel.filterSlides(() => false)],
      ['unfilterSlides', () => carousel.unfilterSlides()],
    ] as const;

    for (const [method, mutate] of mutations) {
      expect(mutate).toThrow(`${method} is not supported with externally rendered slides.`);
      expect(carousel.slider.outerHTML).toBe(markup);
      expect([...carousel.track.children]).toEqual(children);
      expect(carousel.originalSlides).toBe(originals);
      expect(carousel.pendingRenderPlan).toBe(plan);
      expect(carousel.eventController).toBe(eventController);
      expect(eventController?.signal.aborted).toBe(false);
      expect(carousel.enabled).toBe(true);
      expect(carousel.slideCount).toBe(3);
    }
    expect(added.hasAttribute('data-wtcg-slide')).toBe(false);
    expect(added.parentNode).toBeNull();
    expect(destroy).not.toHaveBeenCalled();
    expect(onRenderPlan).toHaveBeenCalledTimes(1);
  });

  it('keeps vanilla add/remove behavior', () => {
    const carousel = createCarousel({ infinite: false });
    carousel.addSlide('<article>Added</article>');
    expect(carousel.slideCount).toBe(4);
    expect(carousel.originalSlides[3]?.textContent).toBe('Added');
    carousel.removeSlide(3);
    expect(carousel.slideCount).toBe(3);
    carousel.removeSlide(0, false, true);
    expect(carousel.slideCount).toBe(0);
  });
});

describe('pending render-plan interaction guards', () => {
  it.each([
    { infinite: false, refresh: false },
    { infinite: true, refresh: false },
    { infinite: false, refresh: true },
    { infinite: true, refresh: true },
  ])(
    'rejects navigation without queueing ($infinite, refresh=$refresh)',
    ({ infinite, refresh }) => {
      const carousel = createCarousel({ infinite, onRenderPlan: vi.fn() });
      if (refresh) {
        commitPlan(carousel);
        carousel.goTo(1, true);
        vi.runAllTimers();
        carousel.refresh();
      }
      const { before, after } = watchChanges(carousel);
      const plan = carousel.pendingRenderPlan!;
      const state = {
        current: carousel.current,
        trackIndex: carousel.trackIndex,
        moveId: carousel.moveId,
        positionWrite: carousel.positionWrite,
        markup: carousel.slider.outerHTML,
      };
      const updateUI = vi.spyOn(carousel, 'updateUI');
      const position = vi.spyOn(carousel, 'runPositionChange');

      carousel.next();
      carousel.prev();
      carousel.goTo(2);
      carousel.goTo(2, true);
      carousel.changeSlide(2);
      carousel.changeSlide(2, true);
      expect(carousel.commitRenderPlan(plan.id + 1)).toBe(false);
      carousel.next();
      vi.runAllTimers();

      expect(carousel.current).toBe(state.current);
      expect(carousel.trackIndex).toBe(state.trackIndex);
      expect(carousel.moveId).toBe(state.moveId);
      expect(carousel.positionWrite).toBe(state.positionWrite);
      expect(carousel.slider.outerHTML).toBe(state.markup);
      expect(carousel.pendingRenderPlan).toBe(plan);
      expect(carousel.animating).toBe(false);
      expect(updateUI).not.toHaveBeenCalled();
      expect(position).not.toHaveBeenCalled();
      expect(before).not.toHaveBeenCalled();
      expect(after).not.toHaveBeenCalled();

      commitPlan(carousel);
      expect(carousel.current).toBe(state.current);
      expect(before).not.toHaveBeenCalled();
      expect(after).not.toHaveBeenCalled();
      carousel.next();
      vi.runAllTimers();
      expect(carousel.current).toBe(state.current + 1);
      expect(before).toHaveBeenCalledTimes(1);
      expect(after).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    { drag: true, refresh: false },
    { drag: 'fixed', refresh: false },
    { drag: 'free', refresh: false },
    { drag: true, refresh: true },
    { drag: 'fixed', refresh: true },
    { drag: 'free', refresh: true },
  ] as const)('rejects drag initiation ($drag, refresh=$refresh)', ({ drag, refresh }) => {
    const carousel = createCarousel({ drag, onRenderPlan: vi.fn() });
    if (refresh) {
      commitPlan(carousel);
      carousel.refresh();
    }
    const { before, after, swipe } = watchChanges(carousel);
    const markup = carousel.slider.outerHTML;
    const clearPreview = vi.spyOn(carousel, 'clearDragPreview');

    dispatchPointer(carousel, 'pointerdown', 200);
    dispatchPointer(carousel, 'pointermove', 20);
    dispatchPointer(carousel, 'pointerup', 20);
    vi.runAllTimers();

    expect(carousel.pointer).toBeNull();
    expect(carousel.pointerDownSlide).toBeNull();
    expect(carousel.dragging).toBe(false);
    expect(carousel.current).toBe(0);
    expect(carousel.slider.outerHTML).toBe(markup);
    expect(carousel.list.setPointerCapture).not.toHaveBeenCalled();
    expect(clearPreview).not.toHaveBeenCalled();
    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
    expect(swipe).not.toHaveBeenCalled();
  });
});

describe.each([false, true])('ready carousel interactions (external=%s)', (external) => {
  it.each([false, true])('allows all navigation entry points (infinite=%s)', (infinite) => {
    const carousel = createCarousel({
      infinite,
      onRenderPlan: external ? vi.fn() : undefined,
    });
    if (external) commitPlan(carousel);
    vi.runAllTimers();
    const { before, after } = watchChanges(carousel);
    const moves = [
      [() => carousel.next(), 1],
      [() => carousel.prev(), 0],
      [() => carousel.goTo(2), 2],
      [() => carousel.goTo(1, true), 1],
      [() => carousel.changeSlide(0), 0],
      [() => carousel.changeSlide(2, true), 2],
    ] as const;
    for (const [move, target] of moves) {
      const current = carousel.current;
      before.mockClear();
      after.mockClear();
      move();
      vi.runAllTimers();
      expect(carousel.current).toBe(target);
      expect(carousel.animating).toBe(false);
      expect(before).toHaveBeenCalledTimes(1);
      expect(before.mock.calls[0]![0].detail).toMatchObject({
        currentSlide: current,
        nextSlide: target,
      });
      expect(after).toHaveBeenCalledTimes(1);
      expect(after.mock.calls[0]![0].detail).toMatchObject({
        currentSlide: target,
      });
    }
  });

  it.each([true, 'fixed', 'free'] as const)('allows dragging (drag=%s)', (drag) => {
    const carousel = createCarousel({
      infinite: false,
      drag,
      onRenderPlan: external ? vi.fn() : undefined,
    });
    if (external) commitPlan(carousel);
    vi.runAllTimers();
    const { before, after, swipe } = watchChanges(carousel);

    dispatchPointer(carousel, 'pointerdown', 250);
    expect(carousel.dragging).toBe(true);
    expect(carousel.list.setPointerCapture).toHaveBeenCalledWith(1);
    dispatchPointer(carousel, 'pointermove', 0);
    dispatchPointer(carousel, 'pointerup', 0);
    vi.runAllTimers();

    expect(carousel.current).toBe(1);
    expect(carousel.dragging).toBe(false);
    expect(carousel.pointer).toBeNull();
    expect(carousel.slider.hasAttribute('data-wtcg-dragging')).toBe(false);
    expect(before).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
    expect(swipe).toHaveBeenCalledTimes(1);
  });
});

describe('slide style cleanup', () => {
  it.each(['destroy', 'refresh'] as const)(
    'preserves latest external author styles during %s',
    (method) => {
      const carousel = createCarousel({ onRenderPlan: vi.fn() });
      commitPlan(carousel);
      const slides = carousel.allSlides;
      const children = [...carousel.track.childNodes];
      expect(slides.some((slide) => slide.hasAttribute('data-wtcg-cloned'))).toBe(true);
      slides.forEach((slide, index) => {
        expect(
          runtimeProperties.every((property) => slide.style.getPropertyValue(property) !== ''),
        ).toBe(true);
        slide.style.color = 'green';
        slide.style.removeProperty('padding');
        slide.style.setProperty('--author', `updated-${index}`, 'important');
        slide.style.setProperty('--wtcg-slide-custom', 'keep');
        slide.style.borderWidth = '4px';
      });

      carousel[method]();

      expect([...carousel.track.childNodes]).toEqual(children);
      slides.forEach((slide, index) => {
        expect(slide.style.color).toBe('green');
        expect(slide.style.padding).toBe('');
        expect(slide.style.getPropertyValue('--author')).toBe(`updated-${index}`);
        expect(slide.style.getPropertyPriority('--author')).toBe('important');
        expect(slide.style.getPropertyValue('--wtcg-slide-custom')).toBe('keep');
        expect(slide.style.borderWidth).toBe('4px');
        expect(
          runtimeProperties.every((property) => slide.style.getPropertyValue(property) === ''),
        ).toBe(true);
        expect(slide.hasAttribute('data-wtcg-active')).toBe(false);
        expect(slide.hasAttribute('data-wtcg-current')).toBe(false);
        expect(slide.hasAttribute('aria-hidden')).toBe(false);
        expect(slide.inert).toBe(false);
        const snapshot = slide.getAttribute('data-wtcg-original-style');
        if (method === 'refresh' && !slide.hasAttribute('data-wtcg-cloned')) {
          expect(snapshot).toBe(slide.style.cssText);
          expect(runtimeProperties.every((property) => !snapshot!.includes(property + ':'))).toBe(
            true,
          );
        } else {
          expect(snapshot).toBeNull();
        }
      });

      if (method === 'refresh') {
        commitPlan(carousel);
        slides.forEach((slide) => {
          slide.style.color = 'blue';
        });
        carousel.destroy();
        slides.forEach((slide) => {
          expect(slide.style.color).toBe('blue');
          expect(
            runtimeProperties.every((property) => slide.style.getPropertyValue(property) === ''),
          ).toBe(true);
        });
      }
    },
  );

  it.each(['destroy', 'refresh'] as const)(
    'restores vanilla snapshots unchanged during %s',
    (method) => {
      const carousel = createCarousel();
      const first = carousel.originalSlides[0]!;
      const originalStyle = first.getAttribute('data-wtcg-original-style');
      first.style.color = 'green';
      first.style.padding = '';
      first.style.setProperty('--author', 'updated');
      first.style.setProperty('--added', 'new');

      carousel[method]();

      if (method === 'refresh') {
        expect(first.getAttribute('data-wtcg-original-style')).toBe(originalStyle);
        expect(first.style.color).toBe('red');
        carousel.destroy();
      }
      expect(first.getAttribute('style')).toBe(originalStyle);
      expect(first.style.getPropertyValue('--added')).toBe('');
      expect(first.hasAttribute('data-wtcg-original-style')).toBe(false);
      expect(
        runtimeProperties.every((property) => first.style.getPropertyValue(property) === ''),
      ).toBe(true);
      expect(carousel.track.querySelector('[data-wtcg-cloned]')).toBeNull();
    },
  );
});
