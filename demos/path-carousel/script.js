import { WtcGorditoCarousel } from 'https://esm.sh/@wethegit/gordito-carousel@1';

const root = document.querySelector('.road');
const view = root.querySelector('[data-wtcg-list]');
const svg = root.querySelector('.road-svg');
const roadLines = svg.querySelectorAll('path');

/*
 * The first half of the road, in 0–1 units of the list box, ending at the
 * center. The second half is the first rotated 180° around the center, so the
 * 50% point of the path (where the current slide sits) is always mid-screen.
 */
const HALF_ROAD = [
  [-0.08, 0.72],
  [0.05, 0.72],
  [0.08, 0.25],
  [0.22, 0.28],
  [0.36, 0.31],
  [0.36, 0.62],
  [0.5, 0.5],
];

function roadPath(width, height) {
  const mirrored = HALF_ROAD.slice(0, -1)
    .toReversed()
    .map(([x, y]) => [1 - x, 1 - y]);
  const points = [...HALF_ROAD, ...mirrored].map(
    ([x, y]) => `${(x * width).toFixed(1)} ${(y * height).toFixed(1)}`,
  );
  const [start, ...curves] = points;
  const segments = [];

  for (let i = 0; i < curves.length; i += 3) {
    segments.push(`C ${curves.slice(i, i + 3).join(', ')}`);
  }

  return `M ${start} ${segments.join(' ')}`;
}

function drawRoad() {
  const { width, height } = view.getBoundingClientRect();
  const d = roadPath(width, height);

  view.style.setProperty('--road', `path("${d}")`);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  roadLines.forEach((line) => line.setAttribute('d', d));
}

drawRoad();
new ResizeObserver(drawRoad).observe(view);

// Exposed so you can poke at it from the console, e.g. `carousel.goTo(3)`.
window.carousel = new WtcGorditoCarousel(root, {
  centerMode: true,
  drag: 'free',
  focusOnSelect: true,
  infinite: true,
});
