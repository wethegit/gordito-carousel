---
'@wethegit/gordito-carousel': patch
---

Fix `drag: 'free'` snapping back to the current slide when the next one was closer. Releasing a free drag now always settles on the nearest slide, however far you dragged. Before, drags shorter than the swipe threshold (list width ÷ `touchThreshold`) always returned to the current slide, which in layouts with narrow slides meant snapping back even after dragging most of the way to the next one. `wtcg:swipe` now also fires on these shorter drags whenever the slide changes.
