# @wethegit/gordito-carousel

## 1.1.0

### Minor Changes

- [#7](https://github.com/wethegit/gordito-carousel/pull/7) [`0436f92`](https://github.com/wethegit/gordito-carousel/commit/0436f929c2fdff77cf1f42dc17b7a323885c63bb) Thanks [@liamegan](https://github.com/liamegan)! - Arrows, pagination, and `goTo()` no longer wait for the current transition to finish. Clicking again mid-transition redirects the moving track, so users can click quickly through slides. `waitForAnimate` now defaults to `false`; set it to `true` to restore the old blocking behaviour.

  This improves on the existing `waitForAnimate` behaviour such that it allows seamless continuous transition when moving to the next group on invinite navigation.

### Patch Changes

- [#5](https://github.com/wethegit/gordito-carousel/pull/5) [`63b404d`](https://github.com/wethegit/gordito-carousel/commit/63b404d7eee95650c4c111f38abe4f303bdffcd1) Thanks [@liamegan](https://github.com/liamegan)! - Fix `drag: 'free'` snapping back to the current slide when the next one was closer. Releasing a free drag now always settles on the nearest slide, however far you dragged. Before, drags shorter than the swipe threshold (list width ÷ `touchThreshold`) always returned to the current slide, which in layouts with narrow slides meant snapping back even after dragging most of the way to the next one. `wtcg:swipe` now also fires on these shorter drags whenever the slide changes.

## 1.0.1

### Patch Changes

- [#3](https://github.com/wethegit/gordito-carousel/pull/3) [`1e1a8af`](https://github.com/wethegit/gordito-carousel/commit/1e1a8af99c28b32635a59b2af5383cc9d236ac0f) Thanks [@liamegan](https://github.com/liamegan)! - Move `prism-react-renderer` to `devDependencies`. It is only used by the demo site, so installing the carousel no longer pulls it in.

## 1.0.0

### Major Changes

- [#1](https://github.com/wethegit/gordito-carousel/pull/1) [`a5b9272`](https://github.com/wethegit/gordito-carousel/commit/a5b927252928e06bbd1358c0406ac2fb9e155f9d) Thanks [@marlonmarcello](https://github.com/marlonmarcello)! - Initial release
