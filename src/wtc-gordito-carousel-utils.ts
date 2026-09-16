/**
 * Converts an array-like value (e.g., `NodeList`, `HTMLCollection`, `arguments`)
 * into a true `Array`.
 *
 * @template T
 * @param value
 * @returns {T[]}
 */
export function toArray<T>(value: ArrayLike<T> | null | undefined): T[] {
  return Array.prototype.slice.call(value || []);
}

/**
 * Resolves a mixed-type argument into an `HTMLElement` (or `window` / `document`).
 *
 * Accepts an element directly, a CSS selector string, `true` (resolves to the
 * fallback), or a falsy value (also resolves to the fallback).
 *
 * @param {unknown} value - Element, selector, boolean, or null.
 * @param {HTMLElement|null} [fallback=null] - Default returned when `value` is
 *   falsy, `true`, or unresolvable.
 * @returns {HTMLElement|Window|Document|null}
 */
export function toElement(
  value: unknown,
  fallback: HTMLElement | null = null,
): HTMLElement | Window | Document | null {
  if (!value) return fallback || null;
  if (value === true) return fallback || null;
  if (value instanceof HTMLElement) return value;
  if (value === window) return window;
  if (value === document) return document;
  if (typeof value === 'string') {
    const element = document.querySelector(value);
    return element instanceof HTMLElement ? element : fallback;
  }
  return fallback || null;
}

/**
 * Reads a numeric CSS custom property from an element.
 *
 * Returns the fallback when the property is unset, zero, or not a finite number.
 *
 * @param {HTMLElement|null|undefined} element
 * @param {string} name - Custom property name (e.g. `--wtcg-slides`).
 * @param {number} fallback - Value returned when the property is not set or invalid.
 * @returns {number}
 */
export function cssNumber(
  element: HTMLElement | null | undefined,
  name: string,
  fallback: number,
): number {
  if (!element) return fallback;
  const raw = window.getComputedStyle(element).getPropertyValue(name).trim();
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Parses an HTML string into a single `Element`.
 *
 * Uses a `<template>` element to avoid side effects like loading images or
 * executing scripts during parsing.
 *
 * @param {string} html
 * @returns {Element|null}
 */
export function createElementFromHtml(html: string): Element | null {
  // neat little function to deal with random HTML where you need
  // to replace just parts of it without regex shenanigans
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

/**
 * Clamps a number between a minimum and maximum value.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Positive modulo — always returns a value in `[0, length)`.
 *
 * Unlike `%`, this handles negative dividends correctly:
 * `modulo(-1, 5)` returns `4`, not `-1`.
 *
 * @param {number} value
 * @param {number} length
 * @returns {number}
 */
export function modulo(value: number, length: number): number {
  return ((value % length) + length) % length;
}

/**
 * Dispatches a `CustomEvent` on an element with the `wtcg:` prefix.
 *
 * The event bubbles so listeners can be attached anywhere up the DOM tree.
 *
 * @param {HTMLElement} element
 * @param {string} name - Event name suffix (e.g. `"init"` → `"wtcg:init"`).
 * @param {Record<string, unknown>} [detail={}] - Data passed to `event.detail`.
 */
export function dispatch(
  element: HTMLElement,
  name: string,
  detail: Record<string, unknown> = {},
): void {
  element.dispatchEvent(
    new CustomEvent(`wtcg:${name}`, {
      bubbles: true,
      detail,
    }),
  );
}
