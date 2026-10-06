# WTC Gordito Carousel 🐽

A small vanilla carousel core with an explicit DOM contract. The library owns behavior, runtime state, and measurement. Authors own markup, semantics, layout styling, and animation.

## Quick Start

```sh
npm install @wethegit/gordito-carousel
```

```js
import { WtcGorditoCarousel } from '@wethegit/gordito-carousel';
import '@wethegit/gordito-carousel/wtc-gordito-carousel.css';

const carousel = new WtcGorditoCarousel(document.querySelector('[data-wtcg-carousel]'), {
  pagination: true,
});
```

```html
<section data-wtcg-carousel aria-roledescription="carousel" aria-label="Featured items">
  <div id="featured-carousel-slides" data-wtcg-list>
    <ul data-wtcg-track>
      <li data-wtcg-slide>First slide</li>
      <li data-wtcg-slide>Second slide</li>
      <li data-wtcg-slide>Third slide</li>
    </ul>
  </div>

  <button
    data-wtcg-prev
    type="button"
    aria-controls="featured-carousel-slides"
    aria-label="Previous slide"
  >
    Previous
  </button>
  <button
    data-wtcg-next
    type="button"
    aria-controls="featured-carousel-slides"
    aria-label="Next slide"
  >
    Next
  </button>

  <div role="group" aria-label="Choose slide">
    <ol data-wtcg-pagination>
      <li>
        <button data-wtcg-page type="button" aria-label="Slide 1">1</button>
      </li>
      <li>
        <button data-wtcg-page type="button" aria-label="Slide 2">2</button>
      </li>
      <li>
        <button data-wtcg-page type="button" aria-label="Slide 3">3</button>
      </li>
    </ol>
  </div>

  <p data-wtcg-status aria-live="polite" aria-atomic="true">Slide {current} of {total}</p>
</section>
```

Options can also be set in markup. Programmatic settings are merged first, then `data-wtcg` overrides them.

```html
<section data-wtcg-carousel data-wtcg='{"pagination":true,"drag":"free"}'>...</section>
```

## Exports

| Export                               | Purpose                                           |
| ------------------------------------ | ------------------------------------------------- |
| `WtcGorditoCarousel`                 | Carousel class.                                   |
| `WTC_GORDITO_CAROUSEL_DEFAULTS`      | Default option object.                            |
| `WTC_GORDITO_CAROUSEL_STATUS_TOKENS` | `{current}` and `{total}` status template tokens. |

## DOM Contract

Required elements:

- `[data-wtcg-carousel]`: Carousel root.
- `[data-wtcg-list]`: Viewport/list element.
- `[data-wtcg-track]`: Moving track element.
- `[data-wtcg-slide]`: Slide element. Direct children of the track are treated as slides by default.

Optional controls:

- `[data-wtcg-prev]`: Previous control.
- `[data-wtcg-next]`: Next control.
- `[data-wtcg-pagination] > * > [data-wtcg-page]`: Pagination controls.
- `[data-wtcg-status]`: Status template for current/total text.

The core never creates wrappers, arrows, pagination, or status markup. If optional controls exist and their corresponding option is enabled, the core wires behavior. If controls are missing, it does nothing.

## Controls

Arrows are attach-only controls. Keep `arrows` enabled when you provide arrow markup; setting `arrows: false` disables arrow behavior. You do not need to set `arrows: false` to prevent generated arrows because the library never generates controls.

Pagination controls are regular slide-picker buttons. This matches the carousel grouped-button model from the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-1-prev-next/).

Arrows can live in the same list as pagination:

```html
<ol data-wtcg-pagination>
  <li>
    <button
      data-wtcg-prev
      type="button"
      aria-controls="featured-carousel-slides"
      aria-label="Previous slide"
    >
      Previous
    </button>
  </li>
  <li><button data-wtcg-page type="button" aria-label="Slide 1">1</button></li>
  <li><button data-wtcg-page type="button" aria-label="Slide 2">2</button></li>
  <li><button data-wtcg-page type="button" aria-label="Slide 3">3</button></li>
  <li>
    <button
      data-wtcg-next
      type="button"
      aria-controls="featured-carousel-slides"
      aria-label="Next slide"
    >
      Next
    </button>
  </li>
</ol>
```

Core behavior for pagination:

- Click or press a pagination button to choose the represented slide.
- The active pagination button receives `[data-wtcg-active]` and `aria-current="true"`.
- Inactive pagination buttons have `aria-current` removed.
- Extra pagination buttons use the native `hidden` attribute when the current layout has fewer reachable positions than slides.

## Status

`[data-wtcg-status]` is an optional template. The author owns live-region semantics and localization. The core replaces exported template tokens with the current logical slide number and total logical slide count.

```jsx
<p data-wtcg-status aria-live="polite" aria-atomic="true">
  Slide {WTC_GORDITO_CAROUSEL_STATUS_TOKENS.CURRENT} of {WTC_GORDITO_CAROUSEL_STATUS_TOKENS.TOTAL}
</p>
```

Tokens:

- `WTC_GORDITO_CAROUSEL_STATUS_TOKENS.CURRENT`: Current original slide number.
- `WTC_GORDITO_CAROUSEL_STATUS_TOKENS.TOTAL`: Original slide count.

Infinite clones are not counted in status text.

## Accessibility

Author responsibilities:

- Give the carousel root an accessible name with `aria-label` or `aria-labelledby`.
- Add `aria-roledescription="carousel"` to the carousel root when useful.
- Use native `button` elements for previous, next, and picker controls.
- Give controls accessible names in author markup.
- Give slides useful accessible names where possible.
- Add `aria-live="polite"` to a dedicated status element when announcements are useful.

Core accessibility behavior:

- Slides outside the active rendered range are set to `inert` and `aria-hidden="true"`.
- Active rendered slides receive `aria-hidden="false"` and are not inert.
- During pointer drag, rendered slide state follows the drag preview.
- Pagination, status text, events, and committed `currentSlide` update only after release.
- Pagination state is exposed with `aria-current="true"`.
- Previous and next disabled state is exposed with native `disabled` and `aria-disabled`.
- Static roles, labels, roledescriptions, and control relationships remain author markup.

## CSS Model

The library CSS is intentionally structural and uses `:where([data-wtcg-*])` selectors inside `@layer wtc-gordito-carousel`. Specificity stays low so ordinary app CSS can override it.

Animation is CSS-owned. Core styles include a basic transform transition, the core writes transforms, and **two data attributes on the carousel root control when the track transform must NOT animate**:

```css
[data-wtcg-track] {
  transition: transform 400ms ease;
}

/* State attributes live on the carousel root [data-wtcg-carousel] */
[data-wtcg-carousel] {
  &[data-wtcg-instant] [data-wtcg-track],
  &[data-wtcg-dragging] [data-wtcg-track] {
    transition: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-wtcg-track] {
    transition: none;
  }
}
```

### Two suppression states

| Attribute              | Element                | When set                                                                                               |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `[data-wtcg-instant]`  | `[data-wtcg-carousel]` | Invisible position corrections: initial layout, responsive refresh, infinite-loop clone normalization. |
| `[data-wtcg-dragging]` | `[data-wtcg-carousel]` | Active pointer drag — the track must follow the pointer, not animate.                                  |

**Neither attribute should affect slide-level transitions (opacity, scale, etc.).** Slide transitions remain active during both drag and instant corrections.

### Mandatory suppression rules

⚠️ **If you override the track transition, you MUST also restore the suppression rules.** Without them, the carousel will jank during drag and visible clone corrections.

The core library ships the suppression rules in `@layer wtc-gordito-carousel` using `:where()` (zero specificity). Any consumer CSS with non-zero specificity or unlayered CSS will override BOTH the default transition AND the suppression rules — even accidentally.

Minimal required suppression when customizing the track transition:

```css
.my-carousel {
  [data-wtcg-track] {
    transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* ⚠️ MANDATORY — suppress track transform during instant corrections */
  &[data-wtcg-instant] [data-wtcg-track],
  /* ⚠️ MANDATORY — suppress track transform during pointer drag */
  &[data-wtcg-dragging] [data-wtcg-track] {
    transition: none;
  }
}
```

### Responsive behavior

Responsive behavior is CSS-first. Change custom properties with media queries or container queries; the core watches size changes and recalculates from the rendered DOM layout.

```css
.my-carousel {
  --wtcg-slides: 1;
  --wtcg-scroll: 1;
  --wtcg-slide-gap: 1rem;
  --wtcg-slide-size: 100cqw;
  container-type: inline-size;
}

@container (min-width: 42rem) {
  .my-carousel {
    --wtcg-slides: 3;
    --wtcg-scroll: 2;
    --wtcg-slide-size: calc((100cqw - var(--wtcg-slide-gap) * 2) / 3);
  }
}
```

## CSS Variables

Author variables:

| Variable                | Purpose                                                                      | Default  |
| ----------------------- | ---------------------------------------------------------------------------- | -------- |
| `--wtcg-slides`         | Number of slides treated as visible/active.                                  | `1`      |
| `--wtcg-scroll`         | Number of slides advanced by arrows and fixed drag.                          | `1`      |
| `--wtcg-slide-size`     | Width applied to each `[data-wtcg-slide]`. Core measures the rendered boxes. | `auto`   |
| `--wtcg-slide-gap`      | Track gap between adjacent slide boxes. Core measures the computed gap.      | `0px`    |
| `--wtcg-center-padding` | List inline padding when `centerMode` is enabled.                            | `0px`    |
| `--wtcg-pagination-gap` | Gap between pagination controls.                                             | `0.5rem` |

Runtime slide variables written by JavaScript:

| Variable                    | Purpose                                                                           |
| --------------------------- | --------------------------------------------------------------------------------- |
| `--wtcg-slide-index`        | Original slide index, normalized to the original slide count.                     |
| `--wtcg-slide-render-index` | Rendered index in the track, including clones.                                    |
| `--wtcg-slide-offset`       | Signed distance from the active rendered slide. Fractional during pointer drag.   |
| `--wtcg-slide-distance`     | Absolute distance from the active rendered slide. Fractional during pointer drag. |
| `--wtcg-slide-side`         | Direction from the active slide: `-1`, `0`, or `1`.                               |

## State Attributes

| Attribute                 | Owner | Element                | Meaning                                                                                                                                                                                                                                |
| ------------------------- | ----- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[data-wtcg-initialized]` | Core  | `[data-wtcg-carousel]` | Carousel has initialized.                                                                                                                                                                                                              |
| `[data-wtcg-active]`      | Core  | `[data-wtcg-slide]`    | Rendered slide is in the active visible range, or pagination control represents the current range.                                                                                                                                     |
| `[data-wtcg-current]`     | Core  | `[data-wtcg-slide]`    | Rendered slide representing the current logical slide.                                                                                                                                                                                 |
| `[data-wtcg-center]`      | Core  | `[data-wtcg-carousel]` | Root uses center mode, or rendered slide is currently centered.                                                                                                                                                                        |
| `[data-wtcg-draggable]`   | Core  | `[data-wtcg-carousel]` | Pointer dragging is enabled on the carousel. **Consumers who override the track transition MUST suppress it under this attribute (see CSS Model section).**                                                                            |
| `[data-wtcg-dragging]`    | Core  | `[data-wtcg-carousel]` | Pointer drag is active on the carousel. Track transform must follow the pointer. **Consumers who override the track transition MUST suppress it under this attribute (see CSS Model section).**                                        |
| `[data-wtcg-instant]`     | Core  | `[data-wtcg-carousel]` | Track transform must not animate. Set during initial layout, responsive refresh, and infinite-loop clone normalization. **Consumers who override the track transition MUST suppress it under this attribute (see CSS Model section).** |

## Infinite Looping

Infinite mode uses a bounded clone loop. The core creates one or more full logical slide sets before and after the original slides, animates onto those clones when crossing an edge, then aligns the track position back to the matching original slide with `[data-wtcg-instant]`.

Tradeoffs:

- DOM growth is bounded and predictable.
- Original child order is preserved for framework renderers.
- Repeated order stays consistent because clones are created in full logical sets.
- Variable-width slides stay measurable because the core positions against rendered DOM boxes.

Inactive duplicate rendered slides remain `aria-hidden` and `inert`. When an infinite clone is inside the active rendered range, that clone becomes the accessible representative for its logical slide. Status and pagination state are still based on original logical slide indexes.

## Options

```js
new WtcGorditoCarousel(element, {
  adaptiveHeight: false,
  arrows: true,
  centerMode: false,
  pagination: false,
  drag: true,
  edgeFriction: 0.35,
  focusOnSelect: false,
  focusOnChange: false,
  infinite: true,
  initialSlide: 0,
  slide: '',
  touchThreshold: 5,
  waitForAnimate: false,
});
```

| Option           | Type                               | Description                                                                                                                        |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `adaptiveHeight` | `boolean`                          | When `--wtcg-slides` resolves to `1`, match list height to the current slide.                                                      |
| `arrows`         | `boolean \| string \| HTMLElement` | Attach existing previous/next controls. `true` searches the root; a selector or element searches that target.                      |
| `centerMode`     | `boolean`                          | Keep the current slide centered and allow partial neighboring slides.                                                              |
| `pagination`     | `boolean \| string \| HTMLElement` | Attach existing pagination controls. `true` searches the root; a selector or element searches that target.                         |
| `drag`           | `boolean \| "fixed" \| "free"`     | `false` disables drag. `true`/`"fixed"` advances by `--wtcg-scroll`. `"free"` snaps to the nearest slide reached by drag distance. |
| `edgeFriction`   | `number`                           | Dampening multiplier when dragging past a non-infinite edge.                                                                       |
| `focusOnSelect`  | `boolean`                          | Clicking a slide moves that slide into the current position.                                                                       |
| `focusOnChange`  | `boolean`                          | Move browser focus to the current slide after each change. Use carefully.                                                          |
| `infinite`       | `boolean`                          | Clone edge slides so movement can wrap.                                                                                            |
| `initialSlide`   | `number`                           | Zero-based initial original slide index.                                                                                           |
| `slide`          | `string`                           | Optional selector to narrow which direct `[data-wtcg-slide]` children participate.                                                 |
| `touchThreshold` | `number`                           | Swipe threshold as a fraction of carousel width. `5` means one-fifth of the width.                                                 |
| `waitForAnimate` | `boolean`                          | Block navigation while a transition runs. When `false` (default), new requests redirect the moving track.                          |

## Methods

| Method                                            | Description                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `next(event?)`                                    | Advance by `--wtcg-scroll`.                                                          |
| `prev(event?)`                                    | Move backward by `--wtcg-scroll`.                                                    |
| `goTo(index, dontAnimate = false)`                | Move to an original slide index.                                                     |
| `getOption(option)`                               | Return a runtime option value.                                                       |
| `setOption(option, value, refresh = false)`       | Update one option. Pass `refresh: true` for layout/control changes.                  |
| `setOption(options, refresh = false)`             | Update multiple options.                                                             |
| `refresh(initializing = false)`                   | Rebuild from current DOM children and options.                                       |
| `destroy(refresh = false)`                        | Remove clones/listeners/state and restore original slides.                           |
| `addSlide(markup, index?, addBefore?)`            | Add one slide and rebuild. Prefer declarative DOM changes in framework integrations. |
| `removeSlide(index, removeBefore?, removeAll?)`   | Remove one or all slides and rebuild.                                                |
| `filterSlides(filter)`                            | Filter original slides by selector or predicate and rebuild.                         |
| `unfilterSlides()`                                | Clear the active filter and rebuild.                                                 |
| `WtcGorditoCarousel.initAll(selector?, options?)` | Initialize all matching elements.                                                    |

## Accessors

| Accessor  | Description                   |
| --------- | ----------------------------- |
| `current` | Current original slide index. |

## Events

Events are bubbling `CustomEvent`s dispatched on the carousel root with the `wtcg:` prefix.

| Event               | Detail                                  |
| ------------------- | --------------------------------------- |
| `wtcg:init`         | `{ carousel }`                          |
| `wtcg:beforeChange` | `{ carousel, currentSlide, nextSlide }` |
| `wtcg:afterChange`  | `{ carousel, currentSlide }`            |
| `wtcg:reInit`       | `{ carousel }`                          |
| `wtcg:setPosition`  | `{ carousel }`                          |
| `wtcg:swipe`        | `{ carousel, direction }`               |
| `wtcg:destroy`      | `{ carousel, refresh }`                 |
