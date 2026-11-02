// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FeaturedGallery, {
  FeaturedGallery as NamedFeaturedGallery,
} from '../site/react/examples/FeaturedGallery.jsx';
import { Carousel, CarouselItem } from '../src/react/index.tsx';
import { WtcGorditoCarousel } from '../src/wtc-gordito-carousel.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const photos = [
  { id: 1015, title: 'Mountain lake', place: 'Dolomites', w: 1200, h: 760 },
  { id: 1025, title: 'Dog portrait', place: 'At home', w: 900, h: 570 },
  { id: 1036, title: 'Forest road', place: 'Oregon', w: 1500, h: 950 },
  { id: 1040, title: 'Sea cliff', place: 'Cornwall', w: 750, h: 475 },
  { id: 1043, title: 'Open field', place: 'Yorkshire', w: 1350, h: 855 },
  { id: 1050, title: 'Harbor', place: 'Copenhagen', w: 1050, h: 665 },
  { id: 1067, title: 'City scene', place: 'Architecture', w: 1200, h: 760 },
  { id: 1074, title: 'Lion', place: 'Wildlife', w: 900, h: 570 },
];
let container;
let root;

beforeEach(() => {
  vi.useFakeTimers();
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

async function settle() {
  await act(() => vi.runAllTimers());
}

async function render() {
  await act(() => root.render(<FeaturedGallery />));
  await settle();
}

async function click(element) {
  expect(element).not.toBeNull();
  await act(() => element.click());
  await settle();
}

function slides() {
  return [...container.querySelector('[data-wtcg-track]').children];
}

function originals() {
  return slides().filter((slide) => !slide.hasAttribute('data-wtcg-cloned'));
}

function pages() {
  return [...container.querySelectorAll('[data-wtcg-page]')];
}

function expectSelection(index) {
  expect(container.querySelector('.react-status').textContent).toBe(
    `Photo ${index + 1} of 8 · ${photos[index].title}`,
  );
  expect(pages().filter((page) => page.getAttribute('aria-current') === 'true')).toEqual([
    pages()[index],
  ]);
}

describe('featured React photo fan', () => {
  it('exports a self-contained items example with stable image keys, items, and homepage fan options', () => {
    expect(FeaturedGallery).toBe(NamedFeaturedGallery);
    const first = FeaturedGallery().props.children;
    const second = FeaturedGallery().props.children;
    expect(first.type).toBe(Carousel);
    expect(first.props.items).toBe(second.props.items);
    expect(first.props.options).toBe(second.props.options);
    expect(first.props.options).toEqual({
      centerMode: true,
      pagination: true,
      drag: 'free',
      focusOnSelect: true,
      infinite: true,
      initialSlide: 1,
    });
    expect(first.props.items.map((item) => item.key)).toEqual(photos.map(({ id }) => String(id)));
    expect(first.props.items.every((item) => item.type === CarouselItem)).toBe(true);
  });

  it('renders eight unique li originals and ordered React copies with unchanged photo attributes', async () => {
    const cloneNode = vi.spyOn(Node.prototype, 'cloneNode');
    await render();

    const carousel = container.querySelector('.react-featured-carousel');
    expect(carousel.parentElement.className).toBe('react-featured-bleed');
    expect(carousel.className).toBe('demo-stage fan react-featured-carousel');
    expect(carousel.getAttribute('aria-label')).toBe('Featured React photo carousel');
    expect(carousel.getAttribute('aria-roledescription')).toBe('carousel');
    expect(container.querySelector('.react-carousel, .react-card')).toBeNull();

    const track = carousel.querySelector('[data-wtcg-track]');
    expect(track.tagName).toBe('UL');
    expect(originals()).toHaveLength(8);
    expect(originals().map((slide) => slide.dataset.wtcgSourceIndex)).toEqual(
      photos.map((_, index) => String(index)),
    );
    expect(originals().map((slide) => slide.querySelector('strong').textContent)).toEqual(
      photos.map(({ title }) => title),
    );
    expect(new Set(originals().map((slide) => slide.querySelector('img').src)).size).toBe(8);

    const copies = slides().filter((slide) => slide.hasAttribute('data-wtcg-cloned'));
    expect(copies.length).toBeGreaterThan(0);
    const perSide = copies.length / 2;
    expect(perSide % 8).toBe(0);
    for (const [position, slide] of slides().entries()) {
      const renderIndex = position - perSide;
      const sourceIndex = ((renderIndex % 8) + 8) % 8;
      const photo = photos[sourceIndex];
      expect(slide.parentElement).toBe(track);
      expect(slide.tagName).toBe('LI');
      expect(slide.hasAttribute('data-wtcg-slide')).toBe(true);
      expect(slide.dataset.wtcgIndex).toBe(String(renderIndex));
      expect(slide.dataset.wtcgSourceIndex).toBe(String(sourceIndex));
      expect(slide.hasAttribute('data-wtcg-cloned')).toBe(renderIndex < 0 || renderIndex >= 8);
      expect(slide.getAttribute('aria-label')).toBe(`${sourceIndex + 1} of 8`);
      expect(slide.children).toHaveLength(1);
      expect(slide.firstElementChild.matches('figure.photo-slide')).toBe(true);
      expect(slide.querySelector('li')).toBeNull();
      expect(slide.querySelector('figcaption strong').textContent).toBe(photo.title);
      expect(slide.querySelector('figcaption em').textContent).toBe(photo.place);
      const image = slide.querySelector('img');
      expect(image.getAttribute('src')).toBe(
        `https://picsum.photos/id/${photo.id}/${photo.w}/${photo.h}`,
      );
      expect(image.getAttribute('width')).toBe(String(photo.w));
      expect(image.getAttribute('height')).toBe(String(photo.h));
      expect(image.getAttribute('alt')).toBe(photo.title);
      expect(image.getAttribute('draggable')).toBe('false');
    }
    expect(cloneNode).not.toHaveBeenCalled();

    for (const [direction, arrow] of [
      ['prev', '←'],
      ['next', '→'],
    ]) {
      const control = carousel.querySelector(`[data-wtcg-${direction}]`);
      expect(control.tagName).toBe('BUTTON');
      expect(control.type).toBe('button');
      expect(control.className).toBe(`stage-arrow ${direction}`);
      expect(control.getAttribute('aria-label')).toBe(
        direction === 'prev' ? 'Previous photo' : 'Next photo',
      );
      expect(control.querySelector('[aria-hidden="true"]').textContent).toBe(arrow);
    }
    const pagination = carousel.querySelector('.controls > [data-wtcg-pagination]');
    expect(pagination.tagName).toBe('OL');
    expect(pagination.getAttribute('aria-label')).toBe('Choose a photo');
    expect(pagination.children).toHaveLength(8);
    expect(pages()).toHaveLength(8);
    for (const [index, page] of pages().entries()) {
      expect(page.parentElement.tagName).toBe('LI');
      expect(page.parentElement.parentElement).toBe(pagination);
      expect(page.tagName).toBe('BUTTON');
      expect(page.type).toBe('button');
      expect(page.textContent).toBe(String(index + 1).padStart(2, '0'));
      expect(page.getAttribute('aria-label')).toBe(`Show ${photos[index].title}`);
    }
    expectSelection(1);
  });

  it('wraps arrows and pagination repeatedly without refreshing or growing/replacing the DOM', async () => {
    await render();
    const refresh = vi.spyOn(WtcGorditoCarousel.prototype, 'refresh');
    const cloneNode = vi.spyOn(Node.prototype, 'cloneNode');
    const initialSlides = slides();
    const initialOriginals = originals();
    const initialNodeCount = container.querySelectorAll('*').length;
    expect(initialSlides.length).toBeGreaterThan(8);
    expect(initialSlides.length).toBeLessThanOrEqual(40);
    expectSelection(1);

    function expectStableDOM() {
      expect(slides()).toHaveLength(initialSlides.length);
      slides().forEach((slide, index) => expect(slide).toBe(initialSlides[index]));
      originals().forEach((slide, index) => expect(slide).toBe(initialOriginals[index]));
      expect(container.querySelectorAll('*')).toHaveLength(initialNodeCount);
      expect(refresh).not.toHaveBeenCalled();
      expect(cloneNode).not.toHaveBeenCalled();
    }

    let selected = 1;
    for (const direction of ['next', 'prev']) {
      for (let step = 0; step < 24; step += 1) {
        await click(container.querySelector(`[data-wtcg-${direction}]`));
        selected = (selected + (direction === 'next' ? 1 : 7)) % 8;
        expectSelection(selected);
        expectStableDOM();
      }
    }

    for (let cycle = 0; cycle < 2; cycle += 1) {
      for (let index = 0; index < 8; index += 1) {
        await click(pages()[index]);
        expectSelection(index);
        expectStableDOM();
      }
      await click(container.querySelector('[data-wtcg-next]'));
      expectSelection(0);
      await click(container.querySelector('[data-wtcg-prev]'));
      expectSelection(7);
      expectStableDOM();
    }

    await render();
    expectSelection(7);
    expectStableDOM();
  });
});
