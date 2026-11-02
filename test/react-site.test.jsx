// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InteractiveGallery } from '../site/react/examples/InteractiveGallery.jsx';
import { EditableGallery } from '../site/react/examples/EditableGallery.jsx';
import { SelectableGallery } from '../site/react/examples/SelectableGallery.jsx';
import { WtcGorditoCarousel } from '../src/wtc-gordito-carousel.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

async function render(Demo) {
  await act(() => root.render(<Demo />));
  await settle();
}

async function click(element) {
  expect(element).not.toBeNull();
  await act(() => element.click());
}

function button(text) {
  const result = [...container.querySelectorAll('button')].find(
    (element) => element.textContent === text,
  );
  expect(result, `Button: ${text}`).toBeDefined();
  return result;
}

function input(label) {
  const result = [...container.querySelectorAll('label')]
    .find((element) => element.textContent.trim() === label)
    ?.querySelector('input');
  expect(result, `Input: ${label}`).toBeDefined();
  return result;
}

async function edit(label, value) {
  const element = input(label);
  await act(() => {
    // Use the native setter so React observes a real input change, not its value tracker.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await settle();
}

function slides() {
  return [...container.querySelector('[data-wtcg-track]').children];
}

function originals() {
  return slides().filter((slide) => !slide.hasAttribute('data-wtcg-cloned'));
}

function copies() {
  return slides().filter((slide) => slide.hasAttribute('data-wtcg-cloned'));
}

function sourceIndices() {
  return originals().map((slide) => slide.dataset.wtcgSourceIndex);
}

function headings() {
  return originals().map((slide) => slide.querySelector('h3').textContent);
}

function status() {
  return [...container.querySelectorAll('.react-status')].map((node) => node.textContent).join(' ');
}

describe('live React site examples', () => {
  it('shares saves by item ID and updates original/copy content and handlers after caption edits', async () => {
    await render(InteractiveGallery);
    expect(originals()).toHaveLength(2);
    expect(copies().length).toBeGreaterThan(0);

    for (const [source, title] of [
      ['0', 'Small rituals'],
      ['1', 'Bright ideas'],
    ]) {
      const caption = `Updated caption for ${title}`;
      await edit(`Caption for ${title}`, caption);
      const occurrences = () =>
        slides().filter((slide) => slide.dataset.wtcgSourceIndex === source);
      const original = occurrences().find((slide) => !slide.hasAttribute('data-wtcg-cloned'));
      const copy = occurrences().find((slide) => slide.hasAttribute('data-wtcg-cloned'));
      expect(copy).toBeDefined();
      for (const slide of occurrences()) {
        expect(slide.querySelector('.react-card-description').textContent).toBe(caption);
      }

      await click(original.querySelector('button'));
      await settle();
      await click(copy.querySelector('button'));
      await settle();
      for (const slide of occurrences()) {
        expect(slide.querySelector('button').textContent).toBe(`Save ${title} (2)`);
      }
      expect(status()).toContain(`Saved ${title}: ${caption}`);
    }
  });

  it('navigates using the hook and standard controls without refreshing items on event-only updates', async () => {
    await render(InteractiveGallery);
    const refresh = vi.spyOn(WtcGorditoCarousel.prototype, 'refresh');
    expect(status()).toContain('Slide 1 of 2');

    await click(button('Next through the hook'));
    expect(status()).toContain('Before change: slide 1 → slide 2.');
    await settle();
    expect(status()).toContain('After change: slide 2.');
    expect(status()).toContain('Slide 2 of 2');

    await click(container.querySelector('[data-wtcg-next]'));
    await settle();
    expect(status()).toContain('Slide 1 of 2');
    await click(container.querySelector('[data-wtcg-prev]'));
    await settle();
    expect(status()).toContain('Slide 2 of 2');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('edits source titles, recovers from empty, reorders stable items, removes and restores defaults', async () => {
    await render(EditableGallery);
    expect(headings()).toEqual(['First light', 'Open roads', 'Going places']);
    await edit('Title for card 1', 'Edited first light');
    expect(headings()[0]).toBe('Edited first light');
    for (const slide of slides().filter((element) => element.dataset.wtcgSourceIndex === '0')) {
      expect(slide.querySelector('h3').textContent).toBe('Edited first light');
    }

    await click(button('Clear all'));
    await settle();
    expect(slides()).toHaveLength(0);
    expect(container.querySelector('.react-empty').textContent).toContain('Add a card');
    expect(status()).toContain('No cards in the source.');
    expect(button('Remove last').disabled).toBe(true);
    expect(button('Reverse order').disabled).toBe(true);
    expect(container.querySelector('[data-wtcg-next]').disabled).toBe(true);

    await click(button('Add a card'));
    await settle();
    await click(button('Add a card'));
    await settle();
    expect(headings()).toEqual(['New card 4', 'New card 5']);
    expect(container.querySelector('.react-empty')).toBeNull();
    const [fourth, fifth] = originals();
    await edit('Title for card 4', 'Kept by stable ID');
    await click(button('Reverse order'));
    await settle();
    expect(headings()).toEqual(['New card 5', 'Kept by stable ID']);
    expect(originals()).toEqual([fifth, fourth]);
    expect(status()).toContain('of 2');

    await click(button('Remove last'));
    await settle();
    expect(headings()).toEqual(['New card 5']);
    await click(button('Restore defaults'));
    await settle();
    expect(headings()).toEqual(['First light', 'Open roads', 'Going places']);
    await click(button('Clear all'));
    await settle();
    await click(button('Restore defaults'));
    await settle();
    expect(headings()).toEqual(['First light', 'Open roads', 'Going places']);
    expect(copies().length).toBeGreaterThan(0);
  });

  it('expands the selector back to source A while keeping B/C originals', async () => {
    await render(SelectableGallery);
    expect(input('Featured only').checked).toBe(true);
    expect(sourceIndices()).toEqual(['1', '2']);
    expect(
      originals().map((slide) => slide.querySelector('.react-card-number').textContent),
    ).toEqual(['B', 'C']);
    const [b, c] = originals();
    for (let cycle = 0; cycle < 2; cycle += 1) {
      await click(input('Featured only'));
      await settle();
      expect(sourceIndices()).toEqual(['0', '1', '2']);
      expect(originals()[1]).toBe(b);
      expect(originals()[2]).toBe(c);
      expect(status()).toContain('Source A');
      expect(originals()[0].classList.contains('standard')).toBe(true);
      await click(input('Featured only'));
      await settle();
      expect(sourceIndices()).toEqual(['1', '2']);
      expect(originals()).toEqual([b, c]);
      expect(slides().every((slide) => slide.classList.contains('featured'))).toBe(true);
    }
  });

  it('changes infinite mode and author styles together, retaining styles across teardown', async () => {
    await render(SelectableGallery);
    expect(input('Infinite + blue accent').checked).toBe(true);
    expect(copies().length).toBeGreaterThan(0);
    const [b, c] = originals();

    for (const infiniteBlue of [false, true, false, true]) {
      await click(input('Infinite + blue accent'));
      await settle();
      expect(originals()).toEqual([b, c]);
      expect(copies().length > 0).toBe(infiniteBlue);
      expect(status()).toContain(infiniteBlue ? 'Infinite / blue' : 'Finite / pink');
      for (const slide of slides()) {
        expect(slide.style.color).toBe(infiniteBlue ? 'rgb(8, 28, 129)' : 'rgb(127, 3, 21)');
        expect(slide.style.backgroundColor).toBe(
          infiniteBlue ? 'rgb(232, 240, 255)' : 'rgb(255, 240, 246)',
        );
      }
      for (const slide of originals()) {
        const snapshot = document.createElement('li');
        snapshot.style.cssText = slide.getAttribute('data-wtcg-original-style');
        expect(snapshot.style.color).toBe(slide.style.color);
        expect(snapshot.style.backgroundColor).toBe(slide.style.backgroundColor);
      }
    }
  });

  it.each([
    ['interactive', InteractiveGallery, 'UL'],
    ['editable', EditableGallery, 'UL'],
    ['selectable', SelectableGallery, 'OL'],
  ])('renders direct li roots for %s originals and React copies', async (_, Demo, tagName) => {
    await render(Demo);
    const carousel = container.querySelector('.react-carousel');
    const track = carousel.querySelector('[data-wtcg-track]');
    expect(carousel.getAttribute('aria-label')).toBeTruthy();
    expect(track.tagName).toBe(tagName);
    expect(copies().length).toBeGreaterThan(0);
    for (const slide of slides()) {
      expect(slide.parentElement).toBe(track);
      expect(slide.tagName).toBe('LI');
      expect(slide.classList.contains('react-card')).toBe(true);
      expect(slide.hasAttribute('data-wtcg-slide')).toBe(true);
      expect(slide.querySelector('li')).toBeNull();
    }
    expect(carousel.querySelector('.react-controls [data-wtcg-prev]')).not.toBeNull();
    expect(carousel.querySelector('.react-controls [data-wtcg-next]')).not.toBeNull();
  });
});
