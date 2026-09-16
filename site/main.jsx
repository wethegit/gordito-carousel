import React, { useEffect, useId, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { WtcGorditoCarousel, WTC_GORDITO_CAROUSEL_STATUS_TOKENS } from '../src/index.ts';
import '../src/wtc-gordito-carousel.css';
import './styles.css';

const IMAGES = [
  { id: 1015, title: 'Mountain lake', place: 'Dolomites', w: 1200, h: 760 },
  { id: 1025, title: 'Dog portrait', place: 'At home', w: 760, h: 1040 },
  { id: 1036, title: 'Forest road', place: 'Oregon', w: 1320, h: 760 },
  { id: 1040, title: 'Sea cliff', place: 'Cornwall', w: 820, h: 1040 },
  { id: 1043, title: 'Open field', place: 'Yorkshire', w: 1180, h: 820 },
  { id: 1050, title: 'Harbor', place: 'Copenhagen', w: 980, h: 980 },
  { id: 1067, title: 'Alpine valley', place: 'Tyrol', w: 1360, h: 780 },
  { id: 1074, title: 'Desert', place: 'Utah', w: 840, h: 1120 },
];
const LANDSCAPE_IMAGES = [IMAGES[0], IMAGES[2], IMAGES[4], IMAGES[6]];
const imageUrl = (image) => `https://picsum.photos/id/${image.id}/${image.w}/${image.h}`;
const fanOptions = {
  centerMode: true,
  pagination: true,
  drag: 'free',
  focusOnSelect: true,
  infinite: true,
  initialSlide: 1,
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    window.setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button className="copy-button" type="button" onClick={copy}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
function Snippet({ label, language, children }) {
  const text = String(children).trim();
  return (
    <div className="snippet">
      <div className="snippet-head">
        <span>{label}</span>
        <span className="snippet-lang">{language}</span>
        <CopyButton text={text} />
      </div>
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  );
}
function SourceCode({ markup, styles, script }) {
  const tabs = [
    ['markup', 'HTML', markup],
    ['styles', 'CSS', styles],
    ['script', 'JavaScript', script],
  ];
  const [active, setActive] = useState('markup');
  const current = tabs.find(([id]) => id === active) || tabs[0];
  return (
    <details className="source-code">
      <summary>
        View source code <span aria-hidden="true">＋</span>
      </summary>
      <div className="source-panel">
        <div className="source-tabs" role="tablist" aria-label="Source code language">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={active === id}
              aria-controls={`panel-${id}`}
              tabIndex={active === id ? 0 : -1}
              onClick={() => setActive(id)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                  event.preventDefault();
                  const next =
                    tabs[
                      (tabs.findIndex(([tabId]) => tabId === active) +
                        (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) %
                        tabs.length
                    ];
                  setActive(next[0]);
                  document.getElementById(`tab-${next[0]}`)?.focus();
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className="source-area"
          role="tabpanel"
          id={`panel-${current[0]}`}
          aria-labelledby={`tab-${current[0]}`}
        >
          <div className="source-area-head">
            <span>{current[1]}</span>
            <CopyButton text={String(current[2]).trim()} />
          </div>
          <pre>
            <code>{String(current[2]).trim()}</code>
          </pre>
        </div>
      </div>
    </details>
  );
}
function Slide({ image, index, total }) {
  return (
    <li
      data-wtcg-slide
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
    >
      <figure
        className="photo-slide"
        style={{ '--asset-width': `${Math.min(28, Math.max(15, (image.w / image.h) * 18))}rem` }}
      >
        <img
          src={imageUrl(image)}
          width={image.w}
          height={image.h}
          alt={image.title}
          loading={index < 2 ? 'eager' : 'lazy'}
          draggable={false}
        />
        <figcaption>
          <span>0{index + 1}</span>
          <strong>{image.title}</strong>
          <em>{image.place}</em>
        </figcaption>
      </figure>
    </li>
  );
}
function Controls({ count }) {
  return (
    <div className="controls" role="group" aria-label="Choose slide">
      <ol data-wtcg-pagination>
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <button data-wtcg-page type="button" aria-label={`Slide ${index + 1}`}>
              {String(index + 1).padStart(2, '0')}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
function CarouselStage({ className, options, slides = IMAGES, title, children }) {
  const ref = useRef(null);
  const titleId = useId();
  const listId = useId();
  // `slides` is reserved for the image-data collection. Custom content belongs
  // in `children`, which is rendered after the carousel controls below.
  const imageSlides = Array.isArray(slides) ? slides : IMAGES;
  useEffect(() => {
    const carousel = new WtcGorditoCarousel(ref.current, options);
    return () => carousel.destroy();
  }, [options]);
  return (
    <div
      className={`demo-stage ${className}`}
      data-wtcg-carousel
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={titleId}
      ref={ref}
    >
      <h3 className="sr-only" id={titleId}>
        {title}
      </h3>
      <div data-wtcg-list id={listId}>
        <ul data-wtcg-track>
          {imageSlides.map((image, index) => (
            <Slide key={image.id} image={image} index={index} total={imageSlides.length} />
          ))}
        </ul>
      </div>
      <button
        className="stage-arrow prev"
        data-wtcg-prev
        type="button"
        aria-controls={listId}
        aria-label="Previous slide"
      >
        ←
      </button>
      <button
        className="stage-arrow next"
        data-wtcg-next
        type="button"
        aria-controls={listId}
        aria-label="Next slide"
      >
        →
      </button>
      {options.pagination && <Controls id={listId} count={imageSlides.length} />}
      <p className="sr-only" data-wtcg-status aria-live="polite" aria-atomic="true">
        Slide {WTC_GORDITO_CAROUSEL_STATUS_TOKENS.CURRENT} of{' '}
        {WTC_GORDITO_CAROUSEL_STATUS_TOKENS.TOTAL}
      </p>
      {children}
    </div>
  );
}
const snippet = (className, options, count = 4) => ({
  markup: `<section class="${className}" data-wtcg-carousel>\n  <div data-wtcg-list><ul data-wtcg-track>\n    <li data-wtcg-slide>Slide content</li>\n  </ul></div>\n  <button data-wtcg-prev type="button">Previous</button>\n  <button data-wtcg-next type="button">Next</button>\n</section>`,
  styles: `.${className} [data-wtcg-list] { --wtcg-slides: ${className === 'responsive' ? 1 : 3}; --wtcg-slide-size: ${className === 'natural' ? 'auto' : '100cqw'}; }`,
  script: `const carousel = new WtcGorditoCarousel(element, ${JSON.stringify(options)});`,
  count,
});
const demos = [
  [
    '01',
    'Defaults',
    'Bare minimum basics',
    'The default behavior advances one image at a time and wires existing previous/next buttons.',
    'basic',
    {},
    LANDSCAPE_IMAGES,
  ],
  [
    '02',
    'Natural sizes',
    'Different image sizes',
    'Keep each image’s natural width with auto-sized slides. Center mode keeps the active image in view.',
    'natural',
    { centerMode: true, drag: 'free', focusOnSelect: true, initialSlide: 2 },
    IMAGES,
  ],
  [
    '03',
    'Center mode',
    'Live drag emphasis',
    'Drag slowly to see active state and fractional runtime variables update with the pointer.',
    'center',
    { centerMode: true, pagination: true, drag: 'free', focusOnSelect: true },
    IMAGES,
  ],
  [
    '04',
    'Flexible controls',
    'Arrows inside pagination',
    'Previous and next can live in the same list as pagination buttons.',
    'infinite',
    { pagination: true, infinite: true },
    LANDSCAPE_IMAGES,
  ],
  [
    '05',
    'Responsive CSS',
    'Responsive slide count',
    'Resize the browser. Container queries change the number of visible slides while the core refreshes measurements.',
    'responsive',
    { pagination: true, infinite: false },
    IMAGES,
  ],
  [
    '06',
    'Full width',
    'Viewport-width carousel',
    'Break out of the reading column without changing the markup or API.',
    'viewport',
    { pagination: true, infinite: true },
    LANDSCAPE_IMAGES,
  ],
  [
    '07',
    'Card carousel',
    'A stacked card carousel',
    'Cards overlap in a deliberate stack. The active card stays clear while offset and distance place quieter cards behind it.',
    'card-carousel',
    fanOptions,
    LANDSCAPE_IMAGES,
  ],
  [
    '08',
    'Focus',
    'Interactive slide content',
    'Only the active rendered range is tabbable. Try tabbing through the slide, then drag it away.',
    'interactive',
    { pagination: true, infinite: true },
    IMAGES.slice(0, 5),
  ],
];
function Demo({ item, number }) {
  const [eyebrow, title, description, className, options, slides] = item;
  const code = snippet(className, options, slides.length);
  return (
    <article className="demo" id={`demo-${number}`}>
      <div className="demo-intro">
        <div className="eyebrow">
          <span>{number}</span>
          {eyebrow}
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <CarouselStage
        className={className}
        options={options}
        slides={Array.isArray(slides) ? slides : IMAGES}
        title={title}
      />
      <SourceCode markup={code.markup} styles={code.styles} script={code.script} />
    </article>
  );
}
function FeatureFan() {
  const code = snippet('fan', fanOptions, LANDSCAPE_IMAGES.length);
  return (
    <section className="feature-fan" aria-label="Featured live demo">
      <CarouselStage
        className="fan"
        options={fanOptions}
        slides={LANDSCAPE_IMAGES}
        title="A fan that follows the pointer"
      />
      <div className="feature-note">
        <span>Featured interaction</span>
        <strong>A fan that follows the pointer</strong>
        <p>
          Cards keep their own angle and depth while the track follows the drag. Release to settle
          on the nearest card.
        </p>
      </div>
      <SourceCode markup={code.markup} styles={code.styles} script={code.script} />
    </section>
  );
}

const quickMarkup = `<section data-wtcg-carousel aria-roledescription="carousel" aria-label="Featured items">\n  <div id="featured-carousel-slides" data-wtcg-list>\n    <ul data-wtcg-track>\n      <li data-wtcg-slide>First slide</li>\n      <li data-wtcg-slide>Second slide</li>\n      <li data-wtcg-slide>Third slide</li>\n    </ul>\n  </div>\n</section>`;
const quickJs = `import { WtcGorditoCarousel } from '@wethegit/gordito-carousel';\nimport '@wethegit/gordito-carousel/wtc-gordito-carousel.css';\n\nconst carousel = new WtcGorditoCarousel(document.querySelector('[data-wtcg-carousel]'), {\n  pagination: true,\n});`;
const suppressCss = `.my-carousel {\n  [data-wtcg-track] { transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1); }\n\n  /* MANDATORY — suppress track transform during instant corrections */\n  &[data-wtcg-instant] [data-wtcg-track],\n  /* MANDATORY — suppress track transform during pointer drag */\n  &[data-wtcg-dragging] [data-wtcg-track] { transition: none; }\n}`;
function Table({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>
                  {typeof cell === 'string' && (cell.startsWith('`') || cell.includes('wtcg')) ? (
                    <code>{cell.replaceAll('`', '')}</code>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Docs() {
  return (
    <section className="docs" id="docs">
      <aside className="docs-nav">
        <p className="kicker">Documentation</p>
        <a href="#quick-start">Quick start</a>
        <a href="#exports">Exports</a>
        <a href="#contract">DOM contract</a>
        <a href="#accessibility">Accessibility</a>
        <a href="#css-model">CSS model</a>
        <a href="#variables">CSS variables</a>
        <a href="#options">Options</a>
        <a href="#methods">Methods</a>
        <a href="#events">Events</a>
      </aside>
      <div className="docs-body">
        <section id="quick-start">
          <p className="kicker">Install / quick start</p>
          <h2>Start with the contract.</h2>
          <p>
            The package entrypoint is <code>@wethegit/gordito-carousel</code>. The structural
            stylesheet is available separately from{' '}
            <code>@wethegit/gordito-carousel/wtc-gordito-carousel.css</code>.
          </p>
          <Snippet label="Quick start" language="JS">
            {quickJs}
          </Snippet>
          <Snippet label="Required markup" language="HTML">
            {quickMarkup}
          </Snippet>
          <p>
            Options can also be set in markup. Programmatic settings are merged first, then{' '}
            <code>data-wtcg</code> overrides them.
          </p>
          <Snippet label="Markup options" language="HTML">
            {
              '<section data-wtcg-carousel data-wtcg=\'{"pagination":true,"drag":"free"}\'>...</section>'
            }
          </Snippet>
        </section>
        <section id="exports">
          <p className="kicker">Public API</p>
          <h2>Exports</h2>
          <Table
            headers={['Export', 'Purpose']}
            rows={[
              [<code>WtcGorditoCarousel</code>, 'Carousel class.'],
              [<code>WTC_GORDITO_CAROUSEL_DEFAULTS</code>, 'Default option object.'],
              [
                <code>WTC_GORDITO_CAROUSEL_STATUS_TOKENS</code>,
                <>
                  <code>{'{current}'}</code> and <code>{'{total}'}</code> status template tokens.
                </>,
              ],
            ]}
          />
        </section>
        <section id="contract">
          <p className="kicker">DOM contract</p>
          <h2>Keep the DOM yours.</h2>
          <p>
            The core never creates wrappers, arrows, pagination, or status markup. If optional
            controls exist and their corresponding option is enabled, the core wires behavior. If
            controls are missing, it does nothing.
          </p>
          <h3>Required elements</h3>
          <ul>
            <li>
              <code>[data-wtcg-carousel]</code>: Carousel root.
            </li>
            <li>
              <code>[data-wtcg-list]</code>: Viewport/list element.
            </li>
            <li>
              <code>[data-wtcg-track]</code>: Moving track element.
            </li>
            <li>
              <code>[data-wtcg-slide]</code>: Slide element. Direct children of the track are
              treated as slides by default.
            </li>
          </ul>
          <h3>Optional controls</h3>
          <ul>
            <li>
              <code>[data-wtcg-prev]</code>: Previous control.
            </li>
            <li>
              <code>[data-wtcg-next]</code>: Next control.
            </li>
            <li>
              <code>[data-wtcg-pagination] &gt; * &gt; [data-wtcg-page]</code>: Pagination controls.
            </li>
            <li>
              <code>[data-wtcg-status]</code>: Status template for current/total text.
            </li>
          </ul>
          <h3>Controls</h3>
          <p>
            Arrows are attach-only controls. Keep <code>arrows</code> enabled when you provide arrow
            markup; <code>arrows: false</code> disables arrow behavior. Pagination buttons choose
            slides; the active button receives <code>[data-wtcg-active]</code> and{' '}
            <code>aria-current="true"</code>. Extra buttons use native <code>hidden</code> when
            fewer positions are reachable.
          </p>
          <Snippet label="Arrows inside pagination" language="HTML">
            {
              '<ol data-wtcg-pagination>\n  <li><button data-wtcg-prev type="button">Previous</button></li>\n  <li><button data-wtcg-page type="button" aria-label="Slide 1">1</button></li>\n  <li><button data-wtcg-next type="button">Next</button></li>\n</ol>'
            }
          </Snippet>
          <h3>Status</h3>
          <p>
            <code>[data-wtcg-status]</code> is an optional template. The author owns live-region
            semantics and localization; tokens are replaced with the current logical slide number
            and total logical slide count. Infinite clones are not counted.
          </p>
        </section>
        <section id="accessibility">
          <p className="kicker">Inclusive by default</p>
          <h2>Accessibility</h2>
          <h3>Author responsibilities</h3>
          <ul>
            <li>
              Give the root an accessible name with <code>aria-label</code> or{' '}
              <code>aria-labelledby</code>.
            </li>
            <li>
              Add <code>aria-roledescription="carousel"</code> when useful.
            </li>
            <li>Use native buttons and give controls accessible names.</li>
            <li>Give slides useful accessible names where possible.</li>
            <li>
              Add <code>aria-live="polite"</code> to a dedicated status element when announcements
              are useful.
            </li>
          </ul>
          <h3>Core behavior</h3>
          <ul>
            <li>
              Slides outside the active rendered range are <code>inert</code> and{' '}
              <code>aria-hidden="true"</code>.
            </li>
            <li>
              Active rendered slides receive <code>aria-hidden="false"</code>.
            </li>
            <li>During pointer drag, rendered slide state follows the drag preview.</li>
            <li>
              Pagination, status, events, and committed <code>currentSlide</code> update after
              release.
            </li>
            <li>
              Pagination exposes <code>aria-current="true"</code>; previous and next expose native{' '}
              <code>disabled</code> and <code>aria-disabled</code>.
            </li>
            <li>
              Static roles, labels, roledescriptions, and control relationships remain author
              markup.
            </li>
          </ul>
        </section>
        <section id="css-model">
          <p className="kicker">CSS model / advanced styling</p>
          <h2>CSS owns the animation.</h2>
          <p>
            Library CSS is structural, uses low-specificity <code>:where([data-wtcg-*])</code>{' '}
            selectors inside <code>@layer wtc-gordito-carousel</code>, and can be overridden by
            ordinary app CSS.
          </p>
          <Snippet label="Basic transition" language="CSS">
            {
              '[data-wtcg-track] { transition: transform 400ms ease; }\n[data-wtcg-carousel][data-wtcg-instant] [data-wtcg-track],\n[data-wtcg-carousel][data-wtcg-dragging] [data-wtcg-track] { transition: none; }\n@media (prefers-reduced-motion: reduce) { [data-wtcg-track] { transition: none; } }'
            }
          </Snippet>
          <h3>Two suppression states</h3>
          <Table
            headers={['Attribute', 'Element', 'When set']}
            rows={[
              [
                <code>[data-wtcg-instant]</code>,
                'Carousel root',
                'Invisible position corrections: initial layout, responsive refresh, and infinite-loop clone normalization.',
              ],
              [
                <code>[data-wtcg-dragging]</code>,
                'Carousel root',
                'Active pointer drag — the track must follow the pointer, not animate.',
              ],
            ]}
          />
          <p>
            <strong>Neither attribute should affect slide-level transitions</strong> such as opacity
            and scale.
          </p>
          <h3>Mandatory suppression rules</h3>
          <p className="warning">
            ⚠ If you override the track transition, you MUST also restore both suppression rules.
            Otherwise the carousel can jank during drag and visible clone corrections. Consumer CSS
            with non-zero specificity or unlayered CSS can override them accidentally.
          </p>
          <Snippet label="Required override" language="CSS">
            {suppressCss}
          </Snippet>
          <h3 id="responsive">Responsive behavior</h3>
          <p>
            Responsive behavior is CSS-first. Change custom properties with media queries or
            container queries; the core watches size changes and recalculates from rendered DOM
            layout.
          </p>
          <Snippet
            label="Container query"
            language="CSS"
          >{`.my-carousel { --wtcg-slides: 1; --wtcg-scroll: 1; --wtcg-slide-gap: 1rem; --wtcg-slide-size: 100cqw; container-type: inline-size; }\n@container (min-width: 42rem) { .my-carousel { --wtcg-slides: 3; --wtcg-scroll: 2; --wtcg-slide-size: calc((100cqw - var(--wtcg-slide-gap) * 2) / 3); } }`}</Snippet>
        </section>
        <section id="variables">
          <p className="kicker">Layout vocabulary</p>
          <h2>CSS variables</h2>
          <Table
            headers={['Variable', 'Purpose', 'Default']}
            rows={[
              [<code>--wtcg-slides</code>, 'Number of slides treated as visible/active.', '1'],
              [<code>--wtcg-scroll</code>, 'Slides advanced by arrows and fixed drag.', '1'],
              [
                <code>--wtcg-slide-size</code>,
                'Width applied to each slide; core measures rendered boxes.',
                'auto',
              ],
              [<code>--wtcg-slide-gap</code>, 'Track gap between adjacent slide boxes.', '0px'],
              [<code>--wtcg-center-padding</code>, 'List inline padding in center mode.', '0px'],
              [<code>--wtcg-pagination-gap</code>, 'Gap between pagination controls.', '0.5rem'],
            ]}
          />
          <h3>Runtime slide variables</h3>
          <Table
            headers={['Variable', 'Purpose']}
            rows={[
              [
                <code>--wtcg-slide-index</code>,
                'Original slide index, normalized to original count.',
              ],
              [<code>--wtcg-slide-render-index</code>, 'Rendered index including clones.'],
              [
                <code>--wtcg-slide-offset</code>,
                'Signed distance from active rendered slide; fractional during drag.',
              ],
              [<code>--wtcg-slide-distance</code>, 'Absolute distance; fractional during drag.'],
              [<code>--wtcg-slide-side</code>, 'Direction: -1, 0, or 1.'],
            ]}
          />
          <h3>State attributes</h3>
          <p>
            <code>data-wtcg-initialized</code>, <code>data-wtcg-active</code>,{' '}
            <code>data-wtcg-current</code>, <code>data-wtcg-center</code>,{' '}
            <code>data-wtcg-draggable</code>, <code>data-wtcg-dragging</code>, and{' '}
            <code>data-wtcg-instant</code> are core-owned state. They describe initialization,
            visible/current slides, center mode, drag capability, active drag, and non-animated
            transforms.
          </p>
          <h3>Styling recipes</h3>
          <Snippet
            label="Centered live-drag emphasis"
            language="CSS"
          >{`.carousel [data-wtcg-list] { --wtcg-slides: 3; --wtcg-slide-size: auto; }\n.carousel [data-wtcg-slide] > * { opacity: calc(1 - min(var(--wtcg-slide-distance, 0), 2) * .25); transform: scale(calc(1 - min(var(--wtcg-slide-distance, 0), 2) * .1)); transition: opacity 240ms ease, transform 240ms ease; }\n.carousel [data-wtcg-center] > * { opacity: 1; transform: scale(1.08); }`}</Snippet>
        </section>
        <section id="infinite">
          <p className="kicker">Infinite looping</p>
          <h2>Bounded clone loops.</h2>
          <p>
            Infinite mode creates one or more full logical slide sets before and after the
            originals, animates across an edge, then aligns back with{' '}
            <code>[data-wtcg-instant]</code>. DOM growth is bounded, original order is preserved,
            repeated order stays consistent, and variable-width slides remain measurable. Inactive
            duplicate rendered slides stay <code>aria-hidden</code> and <code>inert</code>; status
            and pagination use original logical indexes.
          </p>
        </section>
        <section id="options">
          <p className="kicker">Initialization / defaults</p>
          <h2>Options</h2>
          <Snippet
            label="Default options"
            language="JS"
          >{`new WtcGorditoCarousel(element, {\n  adaptiveHeight: false, arrows: true, centerMode: false, pagination: false,\n  drag: true, edgeFriction: 0.35, focusOnSelect: false, focusOnChange: false,\n  infinite: true, initialSlide: 0, slide: '', touchThreshold: 5, waitForAnimate: true,\n});`}</Snippet>
          <Table
            headers={['Option', 'Type', 'Description']}
            rows={[
              [
                <code>adaptiveHeight</code>,
                'boolean',
                'When slides resolves to 1, match list height to current slide.',
              ],
              [
                <code>arrows</code>,
                'boolean | string | HTMLElement',
                'Attach existing previous/next controls; true searches the root.',
              ],
              [
                <code>centerMode</code>,
                'boolean',
                'Center current slide and allow partial neighbors.',
              ],
              [
                <code>pagination</code>,
                'boolean | string | HTMLElement',
                'Attach existing pagination controls.',
              ],
              [
                <code>drag</code>,
                'boolean | "fixed" | "free"',
                'Disable drag, advance fixed, or snap to nearest reached slide.',
              ],
              [<code>edgeFriction</code>, 'number', 'Dampening past a non-infinite edge.'],
              [<code>focusOnSelect</code>, 'boolean', 'Clicking a slide moves it current.'],
              [
                <code>focusOnChange</code>,
                'boolean',
                'Move browser focus after each change; use carefully.',
              ],
              [<code>infinite</code>, 'boolean', 'Clone edge slides so movement wraps.'],
              [<code>initialSlide</code>, 'number', 'Zero-based initial original index.'],
              [<code>slide</code>, 'string', 'Selector narrowing participating direct slides.'],
              [
                <code>touchThreshold</code>,
                'number',
                'Swipe threshold fraction; 5 means one-fifth width.',
              ],
              [<code>waitForAnimate</code>, 'boolean', 'Ignore requests during a transition.'],
            ]}
          />
        </section>
        <section id="methods">
          <p className="kicker">Imperative API</p>
          <h2>Methods & accessors</h2>
          <Table
            headers={['Method', 'Description']}
            rows={[
              [<code>next(event?)</code>, 'Advance by --wtcg-scroll.'],
              [<code>prev(event?)</code>, 'Move backward by --wtcg-scroll.'],
              [<code>goTo(index, dontAnimate = false)</code>, 'Move to an original slide index.'],
              [<code>getOption(option)</code>, 'Return a runtime option.'],
              [<code>setOption(option, value, refresh = false)</code>, 'Update one option.'],
              [<code>setOption(options, refresh = false)</code>, 'Update multiple options.'],
              [<code>refresh(initializing = false)</code>, 'Rebuild from current DOM and options.'],
              [
                <code>destroy(refresh = false)</code>,
                'Remove clones/listeners/state and restore originals.',
              ],
              [<code>addSlide(markup, index?, addBefore?)</code>, 'Add one slide and rebuild.'],
              [
                <code>removeSlide(index, removeBefore?, removeAll?)</code>,
                'Remove one or all slides and rebuild.',
              ],
              [<code>filterSlides(filter)</code>, 'Filter by selector or predicate and rebuild.'],
              [<code>unfilterSlides()</code>, 'Clear active filter and rebuild.'],
              [
                <code>WtcGorditoCarousel.initAll(selector?, options?)</code>,
                'Initialize all matching elements.',
              ],
            ]}
          />
          <h3>Accessor</h3>
          <p>
            <code>current</code> — current original slide index.
          </p>
        </section>
        <section id="events">
          <p className="kicker">Events</p>
          <h2>Listen at the root.</h2>
          <p>
            Events are bubbling <code>CustomEvent</code>s dispatched on the carousel root with the{' '}
            <code>wtcg:</code> prefix.
          </p>
          <Table
            headers={['Event', 'Detail']}
            rows={[
              [<code>wtcg:init</code>, '{ carousel }'],
              [<code>wtcg:beforeChange</code>, '{ carousel, currentSlide, nextSlide }'],
              [<code>wtcg:afterChange</code>, '{ carousel, currentSlide }'],
              [<code>wtcg:reInit</code>, '{ carousel }'],
              [<code>wtcg:setPosition</code>, '{ carousel }'],
              [<code>wtcg:swipe</code>, '{ carousel, direction }'],
              [<code>wtcg:destroy</code>, '{ carousel, refresh }'],
            ]}
          />
        </section>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">🐽</span> gordito
        </a>
        <nav>
          <a href="#demos">Demos</a>
          <a href="#docs">Docs</a>
          <a href="#contract">DOM contract</a>
          <a className="github" href="https://github.com/wethegit/gordito-carousel">
            GitHub ↗
          </a>
        </nav>
      </header>
      <main id="top">
        <section className="identity">
          <p className="kicker">WTC Gordito Carousel</p>
          <h1>
            WTC Gordito Carousel <span>🐽</span>
          </h1>
          <p>
            A small vanilla carousel core with an explicit DOM contract. The library owns behavior,
            runtime state, and measurement. Authors own markup, semantics, layout styling, and
            animation.
          </p>
        </section>
        <FeatureFan />
        <div className="demo-jump">
          <a className="primary-cta" href="#demos">
            See all demos <span>↓</span>
          </a>
          <a className="secondary-cta" href="#docs">
            Read the documentation <span>↓</span>
          </a>
        </div>
        <section className="gallery-head" id="demos">
          <div>
            <p className="kicker">The demo gallery</p>
            <h2>
              Eight ways to <i>move through</i> content.
            </h2>
          </div>
          <p>
            Every example uses the same DOM contract. Resize, drag, tab, and inspect the snippets to
            see the pieces in context.
          </p>
        </section>
        {demos.map((item) => (
          <Demo key={item[0]} item={item} number={item[0]} />
        ))}
        <Docs />
      </main>
      <footer>
        <span className="brand">
          <span className="brand-mark">🐽</span> gordito
        </span>
        <span>Small core. Explicit surface.</span>
      </footer>
    </>
  );
}
createRoot(document.getElementById('root')).render(<App />);
