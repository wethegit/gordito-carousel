import { WtcGorditoCarousel } from 'https://esm.sh/@wethegit/gordito-carousel@1';

// Flap boards only flip forward, so going from "Z" back
// to "A" means travelling through the digits and around the loop.
//
// The set ends with a second blank.
const CHARACTERS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.- ';
const WRAP_INDEX = CHARACTERS.length - 1;
const CELL_COUNT = 16;
const DEPARTURES = [
  'REYKJAVIK  06:15',
  'LISBON     09:40',
  'OAXACA     11:05',
  'OSAKA      13:20',
  'MARRAKESH  16:55',
  'VANCOUVER  22:30',
];
// How long a departure stays up once every cell has finished flipping.
const HOLD_MS = 3000;
// Flips speed up the further a cell is from its target.
const FLIP_SLOW_MS = 450;
const FLIP_FAST_MS = 60;
const RAMP_STEPS = 10;

const row = document.querySelector('.board-row');
const liveText = document.querySelector('[data-board-text]');
const form = document.querySelector('.board-form');
const presets = document.querySelector('.board-presets');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function cellMarkup() {
  const slides = [...CHARACTERS]
    .map((character) => {
      const glyph = character === ' ' ? '&nbsp;' : character;
      return `<span class="flap-char" data-wtcg-slide><span class="flap-half flap-top">${glyph}</span><span class="flap-half flap-bottom">${glyph}</span></span>`;
    })
    .join('');

  return `<div class="flap" data-wtcg-carousel><div class="flap-list" data-wtcg-list><div class="flap-track" data-wtcg-track>${slides}</div></div></div>`;
}

row.innerHTML = Array.from({ length: CELL_COUNT }, cellMarkup).join('');

const cells = [...row.querySelectorAll('[data-wtcg-carousel]')].map((element) => {
  const cell = {
    // Center mode with `--wtcg-slides: 3` marks the previous, current, and next
    // characters active, and CSS hides the rest. The track is pinned, so center
    // mode doesn't move anything.
    carousel: new WtcGorditoCarousel(element, {
      arrows: false,
      centerMode: true,
      drag: false,
      infinite: false,
    }),
    target: 0,
    // True from asking the carousel to move until its `wtcg:afterChange`.
    moving: false,
    // True when the last move was the invisible jump from WRAP_INDEX to 0.
    jumped: false,
    // Duration of the flip in progress, in milliseconds.
    flipMs: FLIP_SLOW_MS,
    timer: null,
  };

  // The track is pinned in CSS, so the core finishes each change within a
  // frame. The flip itself is the slide offset transition, so wait that long
  // before the next step. After the invisible wrap jump, carry straight on.
  element.addEventListener('wtcg:afterChange', () => {
    cell.moving = false;
    schedule(cell, cell.jumped ? 0 : cell.flipMs);
  });

  return cell;
});

// One pending step per cell at most, so changing the message while a cell is
// mid-chain just retargets that chain instead of starting a second one.
function schedule(cell, delay) {
  if (cell.moving || cell.timer !== null) return;

  cell.timer = window.setTimeout(() => {
    cell.timer = null;
    advance(cell);
  }, delay);
}

function advance(cell) {
  const { carousel, target } = cell;
  if (carousel.current === target) {
    queueNextDeparture();
    return;
  }

  cell.moving = true;
  cell.jumped = reducedMotion.matches || carousel.current === WRAP_INDEX;

  if (reducedMotion.matches) {
    carousel.goTo(target, true);
    playClack(0, true);
  } else if (carousel.current === WRAP_INDEX) carousel.goTo(0, true);
  else {
    const steps = stepsToTarget(cell);

    // Set the duration before moving so the offset transition picks it up.
    cell.flipMs = flipDuration(steps);
    carousel.slider.style.setProperty('--flip', `${cell.flipMs}ms`);
    carousel.next();

    // The clack is the bottom flap landing, at the end of the flip.
    playClack(cell.flipMs, steps === 1);
  }
}

// Forward flips left before the cell shows its target. WRAP_INDEX is the same
// blank as 0, so there are WRAP_INDEX distinct positions around the loop.
function stepsToTarget({ carousel, target }) {
  const current = carousel.current % WRAP_INDEX;
  return (target - current + WRAP_INDEX) % WRAP_INDEX;
}

function flipDuration(steps) {
  const progress = Math.min(steps - 1, RAMP_STEPS) / RAMP_STEPS;
  return Math.round(FLIP_SLOW_MS + (FLIP_FAST_MS - FLIP_SLOW_MS) * progress);
}

// Sound is synthesised with Web Audio, so there's no audio file to host.
// Browsers only allow audio after a user gesture, so it starts off and the
// sound toggle creates the audio context on first use.
const soundToggle = document.querySelector('[data-sound-toggle]');
let audio = null;
let soundOn = false;

// Overall level, applied before the compressor. Lower is softer.
const SOUND_VOLUME = 0.5;

function createAudio() {
  const context = new AudioContext();

  // Sixteen cells can clack at once, so compress rather than clip.
  const compressor = context.createDynamicsCompressor();
  compressor.connect(context.destination);

  const output = context.createGain();
  output.gain.value = SOUND_VOLUME;
  output.connect(compressor);

  // 100ms of white noise, reused by every clack.
  const length = Math.round(context.sampleRate * 0.1);
  const noise = context.createBuffer(1, length, context.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < length; i += 1) samples[i] = Math.random() * 2 - 1;

  return { context, output, noise };
}

// A flap settling: a low-passed noise burst, scheduled on the audio clock so
// it lines up with the animation. Low-passing keeps it a soft tap rather than
// a hiss.
function playClack(delayMs, landing) {
  if (!soundOn || !audio) return;

  const { context, output, noise } = audio;
  const time = context.currentTime + delayMs / 1000;
  const peak = landing ? 0.22 : 0.08;
  const decay = landing ? 0.07 : 0.04;

  const source = context.createBufferSource();
  source.buffer = noise;
  source.playbackRate.value = 0.85 + Math.random() * 0.3;

  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = landing ? 900 : 1600 + Math.random() * 400;
  filter.Q.value = 0.7;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.003 + decay);

  source.connect(filter).connect(gain).connect(output);
  source.start(time);
  source.stop(time + 0.003 + decay + 0.01);
}

soundToggle.addEventListener('click', () => {
  audio ??= createAudio();
  soundOn = !soundOn;

  if (soundOn) audio.context.resume();
  else audio.context.suspend();

  soundToggle.setAttribute('aria-pressed', String(soundOn));
});

function show(message) {
  const text = message.toUpperCase().padEnd(CELL_COUNT).slice(0, CELL_COUNT);

  liveText.textContent = text.replace(/\s+/g, ' ').trim();

  cells.forEach((cell, index) => {
    const target = CHARACTERS.indexOf(text[index]);
    cell.target = target === -1 ? 0 : target;

    schedule(cell, index * 35 + Math.random() * 80);
  });
}

// Cycle through departures until someone takes over the board.
let departure = 0;
let cycling = true;
let holdTimer = null;

function queueNextDeparture() {
  if (!cycling || holdTimer !== null) return;

  const settled = cells.every(
    (cell) => cell.carousel.current === cell.target && !cell.moving && cell.timer === null,
  );
  if (!settled) return;

  holdTimer = window.setTimeout(() => {
    holdTimer = null;
    departure = (departure + 1) % DEPARTURES.length;
    show(DEPARTURES[departure]);
  }, HOLD_MS);
}

function takeOver(message) {
  cycling = false;
  window.clearTimeout(holdTimer);
  holdTimer = null;
  show(message);
}

DEPARTURES.forEach((message) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = message.replace(/\s+/g, ' ');
  button.addEventListener('click', () => takeOver(message));
  presets.append(button);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  takeOver(form.elements.message.value);
});

show(DEPARTURES[departure]);
