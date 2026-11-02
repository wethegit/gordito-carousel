# React carousel: review handoff

## What this PR changes

Infinite carousels need extra copies of their slides. Copying DOM nodes works for vanilla usage, but it does not copy React event handlers or create new React component instances.

The new `items` API lets React render those copies. Core still decides how many copies are needed and handles navigation. Infinite mode stays available, and vanilla usage keeps the existing cloning behavior.

## Where to start reviewing

- [React adapter](src/react/index.tsx): the `items` API, slide keys, list markup, and lifecycle effects.
- [Carousel core](src/wtc-gordito-carousel.ts): `buildOut()` creates the render plan. `commitRenderPlan()` validates the result. `destroy()` and the interaction guards protect React-owned DOM.
- [React regression tests](test/react-regressions.test.tsx): selector changes, updated styles, working copy handlers, and retained component state.
- [Core tests](test/core-render-plan.test.ts): pending plans, navigation, dragging, teardown, and rejected DOM mutations.
- [Basic React tests](test/react-items.test.tsx): adding items, empty lists, and custom markup.
- [Live React page](site/react/main.jsx) and [example components](site/react/examples): interactive usage and a browser regression playground.
- [Site example tests](test/react-site.test.jsx): the same components rendered on the live page.
- [Pointer interaction tests](test/interactive-pointer.test.ts): embedded controls keep their native pointer interaction while ordinary card content remains draggable.
- [Package configuration](package.json) and [entry point](src/index.ts): exports and validation commands.

## How rendering works

1. React renders the original items inside the generated list and track.
2. Core calculates a **render plan**. This is a list of originals and copies, with a source item index for each entry.
3. React renders that list using the latest content and handlers from `items`.
4. A layout effect calls `commitRenderPlan(plan.id)` after the DOM is ready.
5. Core checks that the DOM matches the plan, then measures and positions the slides.

The commit step matters because a React state update does not immediately produce DOM. Core must wait before measuring. Navigation and drag initiation are ignored during that wait, not queued.

The number of copies is bounded. Normal navigation reuses them rather than appending more slides on every move.

## How reconciliation works

Originals use a key based on the source item's React key. Copies also include their position in the rendered sequence. This lets React tell an original apart from its copies and reuse matching instances when the list changes.

Use stable item keys. When the key, element type, and surrounding structure stay compatible, originals and surviving copies can keep their local state. Removed copies unmount normally.

**Each copy has its own state and effects.** If clicking any copy should update all versions of that item, keep the state above the carousel and pass it down. The counter example below shows this. Avoid fixed DOM IDs that would be repeated across copies.

## Behavior to keep in mind

- Replace `items` when its content changes. This refreshes core without replacing its instance. The current numeric slide index is preserved where possible, but selection does not follow an item key after reordering.
- Keep `options` stable until the configuration changes. A new options object recreates core and starts from `initialSlide`, which defaults to zero.
- Changing `options.slide` makes all source originals available for discovery again. Clearing a selector must bring excluded items back.
- List tracks use `li` slide roots. Put slide-level styles and selector classes on `CarouselItem` or an explicit `li`.
- React owns slide nodes. Core only cleans up its runtime state and preserves current author styles. Imperative methods such as `addSlide()` and `removeSlide()` throw in items mode. Update the source array instead.
- Without `items`, React-authored children still use DOM cloning. Use `items` when infinite copies need working React handlers.

## How to test this PR

### Run the checks

Use the Node version in [`.nvmrc`](.nvmrc). From the repository root, run:

```sh
npm ci
npm run test
npm run check
npm run build
npm run site:build
```

There are currently 65 tests. `check` runs formatting, lint, and both typechecks. To focus on the new regression coverage:

```sh
npm run test -- test/react-regressions.test.tsx test/core-render-plan.test.ts test/react-site.test.jsx
```

### Try it in a browser

Run `npm run site:dev`, open the URL printed by Vite, and follow the **React** link. The dedicated `/react/` page runs the example components against local source in Strict Mode. There is no temporary harness to set up.

Each demo includes copyable source and a short list of things to try. The [interactive example](site/react/examples/InteractiveGallery.jsx), [editable list](site/react/examples/EditableGallery.jsx), and [selector/style example](site/react/examples/SelectableGallery.jsx) are also covered by automated tests.

Use this checklist while reviewing:

- **Infinite navigation:** with two items, move forwards and backwards across the boundary several times. Also try quick repeated clicks, dragging, and resizing. Look for blank gaps, jumps, or console errors.
- **Working handlers:** save a card in the interactive demo, navigate through a full loop, and check that every version shows the same count. Edit its caption and check that saving uses the new text.
- **Changing items:** add and remove cards, including removing all of them and then adding one back. The carousel should recover without DOM errors.
- **Selector expansion:** use `SelectableGallery`. It starts with B/C. Turn off “Featured only” and confirm A returns. Toggle it a few times.
- **Updated styles:** toggle “Infinite + blue accent” in the selector demo. It changes inline styles and an option together. The original and copies should keep the new color.
- **List markup:** inspect the selector demo's ordered track. Every direct track child should be an `li`, including copies.
- **Vanilla behavior:** follow **All demos** back to the homepage and try its infinite demos again.

The automated tests use JSDOM. Browser checks are still needed for actual layout, transitions, and pointer behavior.

## Usage examples

The examples below are independent. The React entry point includes the core and animation-suppression styles automatically. Add `'use client'` at the application component boundary when using a server-component framework.

### 1. Infinite gallery with controls, pagination, and events

```tsx
'use client';

import { useMemo } from 'react';
import {
  Carousel,
  CarouselItem,
  CarouselNext,
  CarouselPage,
  CarouselPagination,
  CarouselPrevious,
  useCarousel,
} from '@wethegit/gordito-carousel/react';

const galleryOptions = { infinite: true, pagination: true };

type Product = { id: string; title: string };

function GalleryStatus({ total }: { total: number }) {
  const { currentSlide, swipe, setPosition, carousel } = useCarousel();

  return (
    <div>
      <p aria-live="polite">
        {total === 0 ? 'No products' : `Slide ${currentSlide + 1} of ${total}`}
      </p>
      <button type="button" disabled={!carousel} onClick={() => swipe('next')}>
        Next through the hook
      </button>
      <button type="button" onClick={setPosition}>
        Remeasure layout
      </button>
    </div>
  );
}

export function ProductGallery({
  products,
  onSelect,
}: {
  products: readonly Product[];
  onSelect: (id: string) => void;
}) {
  const items = useMemo(
    () =>
      products.map((product) => (
        <CarouselItem key={product.id} className="product-slide">
          <h2>{product.title}</h2>
          <button type="button" onClick={() => onSelect(product.id)}>
            Choose {product.title}
          </button>
        </CarouselItem>
      )),
    [products, onSelect],
  );

  return (
    <Carousel
      className="gallery"
      aria-label="Products"
      items={items}
      options={galleryOptions}
      onBeforeChange={(current, next) => console.log('Moving', current, next)}
      onAfterChange={(current) => console.log('Settled', current)}
    >
      <CarouselPrevious aria-label="Previous product">Previous</CarouselPrevious>
      <CarouselNext aria-label="Next product">Next</CarouselNext>
      <CarouselPagination aria-label="Choose a product">
        {products.map((product, index) => (
          <li key={product.id}>
            <CarouselPage aria-label={`Show ${product.title}`}>{index + 1}</CarouselPage>
          </li>
        ))}
      </CarouselPagination>
      <GalleryStatus total={products.length} />
    </Carousel>
  );
}
```

`GalleryStatus` is inside `Carousel` because `useCarousel()` needs that context. The core instance starts as `null`. Callback slide indices are zero-based.

Children passed alongside `items` appear after the generated track. This is where controls and status content go. The pagination example uses the default one-slide/one-step configuration.

A minimal single-slide layout for the example:

```css
.gallery {
  container-type: inline-size;
  --wtcg-slides: 1;
  --wtcg-scroll: 1;
  --wtcg-slide-size: 100cqw;
}

.gallery > [data-wtcg-list] {
  overflow: hidden;
}

.gallery .product-slide {
  padding: 1rem;
}
```

Keep `products` and `onSelect` stable when their values have not changed to avoid regenerating `items` unnecessarily. Core still refreshes whenever the `items` reference changes, including content-only updates.

### 2. Add/remove items and share state across every copy

This example stores counts above the slides. Clicking any occurrence updates the count displayed by the original and all its copies.

```tsx
'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Carousel,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@wethegit/gordito-carousel/react';

const counterOptions = { infinite: true };

export function CounterGallery() {
  const nextId = useRef(3);
  const [cards, setCards] = useState([
    { id: '1', title: 'First' },
    { id: '2', title: 'Second' },
  ]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const items = useMemo(
    () =>
      cards.map((card) => (
        <CarouselItem key={card.id}>
          <h2>{card.title}</h2>
          <button
            type="button"
            onClick={() =>
              setCounts((previous) => ({
                ...previous,
                [card.id]: (previous[card.id] ?? 0) + 1,
              }))
            }
          >
            Count: {counts[card.id] ?? 0}
          </button>
          <button
            type="button"
            onClick={() => setCards((previous) => previous.filter((item) => item.id !== card.id))}
          >
            Remove {card.title}
          </button>
        </CarouselItem>
      )),
    [cards, counts],
  );

  function addCard() {
    const id = String(nextId.current++);
    setCards((previous) => [...previous, { id, title: `Card ${id}` }]);
  }

  return (
    <div>
      <button type="button" onClick={addCard}>
        Add a card
      </button>
      <Carousel className="gallery" aria-label="Counters" items={items} options={counterOptions}>
        <CarouselPrevious>Previous</CarouselPrevious>
        <CarouselNext>Next</CarouselNext>
      </Carousel>
    </div>
  );
}
```

Reuse the `.gallery` CSS from the first example. Filter or reorder by creating a new source array. Do not mutate the existing array or call core's structural mutation methods.

### 3. Change a slide selector without losing excluded items

Here the source elements stay stable while configuration selects a subset. Switching back to all items restores the excluded source.

```tsx
'use client';

import { useMemo, useState } from 'react';
import { Carousel, CarouselItem, CarouselNext } from '@wethegit/gordito-carousel/react';

const catalogItems = [
  <CarouselItem key="a" className="standard">
    A
  </CarouselItem>,
  <CarouselItem key="b" className="featured">
    B
  </CarouselItem>,
  <CarouselItem key="c" className="featured">
    C
  </CarouselItem>,
];

export function SelectableGallery() {
  const [featuredOnly, setFeaturedOnly] = useState(true);
  const options = useMemo(
    () => ({ infinite: true, slide: featuredOnly ? '.featured' : '' }),
    [featuredOnly],
  );

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={featuredOnly}
          onChange={(event) => setFeaturedOnly(event.target.checked)}
        />
        Featured only
      </label>
      <Carousel className="gallery" aria-label="Catalog" items={catalogItems} options={options}>
        <CarouselNext>Next</CarouselNext>
      </Carousel>
    </div>
  );
}
```

Filtering the source array before building `items` is also supported and is often simpler for application-level filtering. The example uses `options.slide` specifically to illustrate selector-driven rediscovery.

### 4. Customize the generated elements

For an ordered list, non-`li` content is wrapped in an `li` slide root:

```tsx
import { Carousel } from '@wethegit/gordito-carousel/react';

export function OrderedGallery() {
  return (
    <Carousel
      trackAs="ol"
      aria-label="Steps"
      items={[
        <div key="prepare">Prepare</div>,
        <button key="start" type="button" onClick={() => console.log('Start')}>
          Start
        </button>,
      ]}
    />
  );
}
```

For a non-list track, intrinsic roots and `CarouselItem` roots can pass through directly:

```tsx
import { Carousel, CarouselItem } from '@wethegit/gordito-carousel/react';

export function ArticleGallery() {
  return (
    <Carousel
      listAs="section"
      trackAs="div"
      aria-label="Articles"
      items={[
        <CarouselItem key="news" as="article">
          News
        </CarouselItem>,
        <CarouselItem key="events" as="article">
          Events
        </CarouselItem>,
      ]}
    />
  );
}
```

Custom components other than `CarouselItem` get a wrapper. It is an `li` for list tracks and a `div` otherwise. Custom components used as `listAs` or `trackAs` must forward the supplied attributes and children.
