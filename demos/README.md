# Standalone demos

Self-contained demos meant to be moved to CodePen. Each folder has three files that map onto
CodePen's panes:

| File         | CodePen pane                         |
| ------------ | ------------------------------------ |
| `index.html` | HTML — only the contents of `<body>` |
| `style.css`  | CSS                                  |
| `script.js`  | JS                                   |

They load the published package from CDNs rather than this repo's source, so no build step or
CodePen settings are needed:

- JS: `https://esm.sh/@wethegit/gordito-carousel@1`
- CSS: `https://cdn.jsdelivr.net/npm/@wethegit/gordito-carousel@1/dist/wtc-gordito-carousel.css`
  (imported at the top of each `style.css`)

To run locally, serve this folder with any static server, e.g. `python3 -m http.server` from
`demos/`, and open `/path-carousel/` or `/split-flap/`.

## Demos

- **`path-carousel`** — slides travel along a winding road with CSS `offset-path`. The track
  is cancelled out so it only acts as a positioning origin.
- **`split-flap`** — a departure board where every character cell is its own carousel,
  stepped with `next()` from `wtcg:afterChange` until it reaches its target character.

## Technique

Both demos **register `--wtcg-slide-offset` with `@property`** so it can transition. Clicks and
arrows then animate the offset exactly like a drag does, and the whole layout is derived from
that one number. Both also **snap the offset under `[data-wtcg-instant]`**, otherwise jumps and
infinite-loop corrections, which shift every offset at once, visibly spin every slide.

They differ in what happens to the track the core moves:

- **`path-carousel` cancels it.** Each slide counter-translates by the same offset, with the
  same duration and easing as the track transition. The track still really moves, so
  `waitForAnimate` and infinite-loop corrections wait for its `transitionend`. That only holds
  up when the transition is long: the core starts the offset transitions about a frame before
  the track's, which is invisible over 650ms.
- **`split-flap` pins it** with `transform: none !important` and no transition, and stacks the
  slides with absolute positioning. The core then finishes each change within a frame, so the
  script paces steps itself, waiting one flip after each `wtcg:afterChange`; flips speed up the further a cell is from its target. At short flip durations,
  cancelling the track would visibly slide characters sideways.

Slide widths are rounded to whole pixels with `round()` because the core measures slides with
`offsetWidth`. Fractional widths would build up visible drift across long tracks.
