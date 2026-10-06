---
'@wethegit/gordito-carousel': minor
---

Arrows, pagination, and `goTo()` no longer wait for the current transition to finish. Clicking again mid-transition redirects the moving track, so users can click quickly through slides. `waitForAnimate` now defaults to `false`; set it to `true` to restore the old blocking behaviour.

This improves on the existing `waitForAnimate` behaviour such that it allows seamless continuous transition when moving to the next group on invinite navigation.
