// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WtcGorditoCarousel, type WtcGorditoCarouselOptions } from '../src/wtc-gordito-carousel.js';

let carousels: WtcGorditoCarousel[];
const controls = [
  '<button><span>Button</span><svg><path d="M0 0" /></svg></button>',
  '<a href="#example"><span>Link</span></a>',
  '<a><span>Anchor</span></a>',
  '<input value="Input">',
  '<select><option>Option</option></select>',
  '<textarea>Text</textarea>',
  '<div contenteditable><span>Editable</span></div>',
  '<div contenteditable="true"><span>Editable</span></div>',
  '<div contenteditable="plaintext-only"><span>Editable</span></div>',
  '<div contenteditable="TRUE"><span>Editable</span></div>',
  '<div role="button"><span>Button role</span></div>',
  '<div role="link"><span>Link role</span></div>',
];

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

function createCarousel(external: boolean, options: Partial<WtcGorditoCarouselOptions> = {}) {
  const slider = document.createElement('section');
  slider.innerHTML = `
    <div data-wtcg-list>
      <ul data-wtcg-track>
        <li data-wtcg-slide>First</li>
        <li data-wtcg-slide>Second</li>
        <li data-wtcg-slide>Third</li>
      </ul>
    </div>`;
  document.body.append(slider);
  const list = slider.querySelector<HTMLElement>('[data-wtcg-list]')!;
  vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 300, 100));
  Object.defineProperties(list, {
    setPointerCapture: { value: vi.fn() },
    releasePointerCapture: { value: vi.fn() },
  });
  const carousel = new WtcGorditoCarousel(slider, {
    infinite: false,
    onRenderPlan: external ? vi.fn() : undefined,
    ...options,
  });
  carousels.push(carousel);
  return carousel;
}

// These finite fixtures need no clones; simulate the external renderer's commit.
function commitPlan(carousel: WtcGorditoCarousel) {
  const plan = carousel.pendingRenderPlan!;
  const slides = plan.slides.map((item) => {
    expect(item.isClone).toBe(false);
    const slide = carousel.originalSlides[item.sourceIndex]!;
    slide.setAttribute('data-wtcg-index', String(item.index));
    slide.setAttribute('data-wtcg-source-index', String(item.sourceIndex));
    return slide;
  });
  carousel.track.replaceChildren(...slides);
  expect(carousel.commitRenderPlan(plan.id)).toBe(true);
}

function dispatchPointer(target: Element, type: string, clientX = 250) {
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
  target.dispatchEvent(event);
  return event;
}

function state(carousel: WtcGorditoCarousel) {
  return {
    markup: carousel.slider.outerHTML,
    pointer: carousel.pointer,
    pointerDownSlide: carousel.pointerDownSlide,
    pointerDownSlideTimer: carousel.pointerDownSlideTimer,
    dragging: carousel.dragging,
    shouldSuppressClick: carousel.shouldSuppressClick,
    current: carousel.current,
    trackIndex: carousel.trackIndex,
    moveId: carousel.moveId,
    animating: carousel.animating,
    rebasing: carousel.rebasing,
    positionWrite: carousel.positionWrite,
    positionOffset: carousel.positionOffset,
    previewTrackIndex: carousel.previewTrackIndex,
    previewPosition: carousel.previewPosition,
    pendingRenderPlan: carousel.pendingRenderPlan,
    transitionCleanups: carousel.transitionCleanups.size,
  };
}

function interactiveTargets(carousel: WtcGorditoCarousel) {
  const slide = carousel.originalSlides[carousel.current]!;
  slide.innerHTML = controls.join('');
  return [...slide.querySelectorAll('*')];
}

describe.each([false, true])('interactive pointer targets (external=%s)', (external) => {
  it('ignores native controls, editable hosts, roles and nested children without mutation', () => {
    const carousel = createCarousel(external);
    if (external) commitPlan(carousel);
    vi.runAllTimers();
    const targets = interactiveTargets(carousel);
    const expire = vi.fn();
    carousel.pointerDownSlide = carousel.originalSlides[0]!;
    carousel.pointerDownSlideTimer = window.setTimeout(expire, 500);
    carousel.previewTrackIndex = 0.5;
    carousel.previewPosition = 0.5;
    const before = state(carousel);
    const clearPreview = vi.spyOn(carousel, 'clearDragPreview');
    const position = vi.spyOn(carousel, 'applyPosition');
    const clearTimeout = vi.spyOn(window, 'clearTimeout');

    for (const target of targets) {
      expect(dispatchPointer(target, 'pointerdown').defaultPrevented).toBe(false);
      expect(state(carousel)).toEqual(before);
      expect(dispatchPointer(target, 'pointermove', 0).defaultPrevented).toBe(false);
      expect(dispatchPointer(target, 'pointerup', 0).defaultPrevented).toBe(false);
      expect(state(carousel)).toEqual(before);
    }

    expect(carousel.list.setPointerCapture).not.toHaveBeenCalled();
    expect(carousel.list.releasePointerCapture).not.toHaveBeenCalled();
    expect(clearPreview).not.toHaveBeenCalled();
    expect(position).not.toHaveBeenCalled();
    expect(clearTimeout).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(expire).toHaveBeenCalledOnce();
  });

  it('does not interrupt an in-flight move when pressing a control', () => {
    const carousel = createCarousel(external, { waitForAnimate: false });
    if (external) commitPlan(carousel);
    vi.runAllTimers();
    carousel.track.style.transitionProperty = 'transform';
    carousel.track.style.transitionDuration = '1s';
    const after = vi.fn();
    carousel.slider.addEventListener('wtcg:afterChange', after);
    carousel.goTo(1);
    vi.runAllTimers();
    expect(carousel.animating).toBe(true);
    const targets = interactiveTargets(carousel);
    const before = state(carousel);
    const renderedOffset = vi.spyOn(carousel, 'getRenderedOffset').mockReturnValue(-150);
    const clearPreview = vi.spyOn(carousel, 'clearDragPreview');
    const position = vi.spyOn(carousel, 'applyPosition');

    for (const target of targets) {
      dispatchPointer(target, 'pointerdown');
      expect(state(carousel)).toEqual(before);
      dispatchPointer(target, 'pointerup');
    }

    expect(carousel.list.setPointerCapture).not.toHaveBeenCalled();
    expect(renderedOffset).not.toHaveBeenCalled();
    expect(clearPreview).not.toHaveBeenCalled();
    expect(position).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
    const end = new Event('transitionend');
    Object.defineProperty(end, 'propertyName', { value: 'transform' });
    carousel.track.dispatchEvent(end);
    expect(carousel.animating).toBe(false);
    expect(carousel.current).toBe(1);
    expect(after).toHaveBeenCalledOnce();
  });

  it('still drags ordinary card content, noneditable content and the list in every drag mode', () => {
    for (const drag of [true, 'fixed', 'free'] as const) {
      const carousel = createCarousel(external, { drag });
      if (external) commitPlan(carousel);
      vi.runAllTimers();
      const slide = carousel.originalSlides[0]!;
      slide.innerHTML =
        '<span>Card</span><div contenteditable="false"><span>Not editable</span></div>';
      const targets = [slide.firstElementChild!, slide.querySelector('div span')!, carousel.list];

      for (const target of targets) {
        carousel.goTo(0, true);
        vi.runAllTimers();
        dispatchPointer(target, 'pointerdown');
        expect(carousel.dragging).toBe(true);
        expect(carousel.pointerDownSlide).toBe(target === carousel.list ? null : slide);
        expect(carousel.list.setPointerCapture).toHaveBeenCalledWith(1);
        dispatchPointer(carousel.list, 'pointermove', 0);
        dispatchPointer(carousel.list, 'pointerup', 0);
        vi.runAllTimers();
        expect(carousel.current).toBe(1);
        expect(carousel.dragging).toBe(false);
        expect(carousel.pointer).toBeNull();
        expect(carousel.list.releasePointerCapture).toHaveBeenCalledWith(1);
      }
    }
  });
});

it('keeps the pending render-plan guard for both interactive and ordinary targets', () => {
  const carousel = createCarousel(true);
  const targets = [...interactiveTargets(carousel), carousel.originalSlides[0]!, carousel.list];
  const before = state(carousel);
  const clearPreview = vi.spyOn(carousel, 'clearDragPreview');
  for (const target of targets) {
    dispatchPointer(target, 'pointerdown');
    dispatchPointer(target, 'pointermove', 0);
    dispatchPointer(target, 'pointerup', 0);
    expect(state(carousel)).toEqual(before);
  }
  expect(carousel.list.setPointerCapture).not.toHaveBeenCalled();
  expect(clearPreview).not.toHaveBeenCalled();
});
