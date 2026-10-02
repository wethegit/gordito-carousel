import React, { useEffect, useId, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Highlight } from "prism-react-renderer";
import {
  WtcGorditoCarousel,
  WTC_GORDITO_CAROUSEL_STATUS_TOKENS,
} from "../src/index.ts";
import "../src/wtc-gordito-carousel.css";
import "./styles.css";

const DEMO_IMAGES = [
  { id: 1015, title: "Mountain lake", place: "Dolomites", w: 1200, h: 760 },
  { id: 1025, title: "Dog portrait", place: "At home", w: 900, h: 570 },
  { id: 1036, title: "Forest road", place: "Oregon", w: 1500, h: 950 },
  { id: 1040, title: "Sea cliff", place: "Cornwall", w: 750, h: 475 },
  { id: 1043, title: "Open field", place: "Yorkshire", w: 1350, h: 855 },
  { id: 1050, title: "Harbor", place: "Copenhagen", w: 1050, h: 665 },
  { id: 1067, title: "Alpine valley", place: "Tyrol", w: 1200, h: 760 },
  { id: 1074, title: "Desert", place: "Utah", w: 900, h: 570 },
];
const LANDSCAPE_IMAGES = [
  DEMO_IMAGES[0],
  DEMO_IMAGES[2],
  DEMO_IMAGES[4],
  DEMO_IMAGES[6],
];
const FULL_WIDTH_IMAGES = LANDSCAPE_IMAGES;
const NATURAL_IMAGES = [
  { id: 1015, title: "Mountain lake", place: "Dolomites", w: 1200, h: 760 },
  { id: 1025, title: "Dog portrait", place: "At home", w: 760, h: 1040 },
  { id: 1036, title: "Forest road", place: "Oregon", w: 1320, h: 760 },
  { id: 1040, title: "Sea cliff", place: "Cornwall", w: 820, h: 1040 },
  { id: 1050, title: "Harbor", place: "Copenhagen", w: 980, h: 980 },
];
const imageUrl = (image) =>
  `https://picsum.photos/id/${image.id}/${image.w}/${image.h}`;
const fanOptions = {
  centerMode: true,
  pagination: true,
  drag: "free",
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
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
const prismLanguage = (language) => {
  if (language === "HTML") return "markup";
  if (language === "CSS") return "css";
  return "javascript";
};
function CodeBlock({ text, language }) {
  return (
    <Highlight code={text} language={prismLanguage(language)}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className="code-pre">
          <code>
            {tokens.map((line, lineIndex) => (
              <div {...getLineProps({ line, key: lineIndex })} key={lineIndex}>
                {line.map((token, tokenIndex) => (
                  <span
                    {...getTokenProps({ token, key: tokenIndex })}
                    key={tokenIndex}
                  />
                ))}
              </div>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
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
      <CodeBlock text={text} language={language} />
    </div>
  );
}
function SourceCode({ markup, styles, script }) {
  const tabs = [
    ["markup", "HTML", markup],
    ["styles", "CSS", styles],
    ["script", "JavaScript", script],
  ];
  const [active, setActive] = useState("markup");
  const current = tabs.find(([id]) => id === active) || tabs[0];
  return (
    <details className="source-code">
      <summary>
        View source code <span aria-hidden="true">＋</span>
      </summary>
      <div className="source-panel">
        <div
          className="source-tabs"
          role="tablist"
          aria-label="Source code language"
        >
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
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  const next =
                    tabs[
                      (tabs.findIndex(([tabId]) => tabId === active) +
                        (event.key === "ArrowRight" ? 1 : tabs.length - 1)) %
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
          <CodeBlock text={String(current[2]).trim()} language={current[1]} />
        </div>
      </div>
    </details>
  );
}
function Slide({ image, index, total, interactive = false }) {
  if (interactive) {
    return (
      <li
        className="story-slide"
        data-wtcg-slide
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${total}`}
      >
        <div>
          <h3>{image.title}</h3>
          <p>
            A small pause in the middle of the day. Only the visible story is
            tabbable.
          </p>
          <div className="slide-actions">
            <a href="#docs">Read more</a>
            <button type="button">Save slide</button>
          </div>
        </div>
      </li>
    );
  }
  return (
    <li
      data-wtcg-slide
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
    >
      <figure className="photo-slide">
        <img
          src={imageUrl(image)}
          width={image.w}
          height={image.h}
          alt={image.title}
          loading="eager"
          draggable={false}
        />
        <figcaption>
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
            <button
              data-wtcg-page
              type="button"
              aria-label={`Slide ${index + 1}`}
            >
              {String(index + 1).padStart(2, "0")}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
function CarouselStage({
  className,
  options,
  slides = DEMO_IMAGES,
  title,
  children,
}) {
  const ref = useRef(null);
  const titleId = useId();
  const listId = useId();
  // `slides` is reserved for the image-data collection. Custom content belongs
  // in `children`, which is rendered after the carousel controls below.
  const imageSlides = Array.isArray(slides) ? slides : DEMO_IMAGES;
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
      {...(title
        ? { "aria-labelledby": titleId }
        : { "aria-label": `${className} carousel` })}
      ref={ref}
    >
      {title && (
        <h3 className="sr-only" id={titleId}>
          {title}
        </h3>
      )}
      <div data-wtcg-list id={listId}>
        <ul data-wtcg-track>
          {imageSlides.map((image, index) => (
            <Slide
              key={image.id}
              image={image}
              index={index}
              total={imageSlides.length}
              interactive={className === "interactive"}
            />
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
      {options.pagination && <Controls count={imageSlides.length} />}
      <p
        className="sr-only"
        data-wtcg-status
        aria-live="polite"
        aria-atomic="true"
      >
        Slide {WTC_GORDITO_CAROUSEL_STATUS_TOKENS.CURRENT} of{" "}
        {WTC_GORDITO_CAROUSEL_STATUS_TOKENS.TOTAL}
      </p>
      {children}
    </div>
  );
}
const formatOptions = (options) => {
  const entries = Object.entries(options);
  if (!entries.length)
    return "const carousel = new WtcGorditoCarousel(element);";
  return `const carousel = new WtcGorditoCarousel(element, {\n${entries.map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`).join("\n")}\n});`;
};
const markupFor = (className, count, paginationEnabled = false) => {
  const slide =
    className === "interactive"
      ? `    <li class="story-slide" data-wtcg-slide>
      <div>
        <h3>Slide title</h3>
        <p>Slide content</p>
        <div class="slide-actions">
          <a href="#docs">Read more</a>
          <button type="button">Save slide</button>
        </div>
      </div>
    </li>`
      : `    <li data-wtcg-slide>
      <figure class="photo-slide">
        <img src="image.jpg" alt="Slide title" />
        <figcaption>
          <strong>Slide title</strong>
          <em>Place</em>
        </figcaption>
      </figure>
    </li>`;
  const pagination =
    paginationEnabled && count > 1
      ? `\n  <div role="group" aria-label="Choose slide">\n    <ol data-wtcg-pagination>\n${Array.from({ length: Math.min(count, 4) }, (_, index) => `      <li><button data-wtcg-page type="button" aria-label="Slide ${index + 1}">${index + 1}</button></li>`).join("\n")}\n    </ol>\n  </div>`
      : "";
  return `<section class="${className}" data-wtcg-carousel aria-roledescription="carousel" aria-label="Featured items">
  <div data-wtcg-list>
    <ul data-wtcg-track>
${slide}
    </ul>
  </div>
  <button data-wtcg-prev type="button" aria-label="Previous slide">
    Previous
  </button>
  <button data-wtcg-next type="button" aria-label="Next slide">
    Next
  </button>${pagination}
</section>`;
};
const styleFor = (className) =>
  ({
    basic: `.basic [data-wtcg-list] {
  --wtcg-slides: 1;
  --wtcg-slide-size: 100cqw;
  border: 1px solid var(--line);
}`,
    natural: `.natural [data-wtcg-list] {
  --wtcg-slides: 3;
  --wtcg-slide-size: auto;
  --wtcg-center-padding: 7vw;
}

.natural .photo-slide {
  width: 100%;
  max-width: 28rem;
}

.natural [data-wtcg-slide] {
  transition: opacity 300ms ease;
}

.natural [data-wtcg-track] {
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* MANDATORY: suppress the track during instant corrections and pointer drag. */
.natural[data-wtcg-instant] [data-wtcg-track],
.natural[data-wtcg-dragging] [data-wtcg-track] {
  transition: none;
}

.natural[data-wtcg-dragging] [data-wtcg-slide],
.natural[data-wtcg-instant] [data-wtcg-slide],
.natural[data-wtcg-dragging] .photo-slide,
.natural[data-wtcg-instant] .photo-slide {
  transition: none;
}`,
    responsive: `.responsive [data-wtcg-list] {
  --wtcg-slides: 1;
  --wtcg-slide-size: 100cqw;
  padding-block: 2px 14px;
}

@container (min-width: 42rem) {
  .responsive [data-wtcg-list] {
    --wtcg-slides: 2;
    --wtcg-slide-size: calc((100cqw - var(--wtcg-slide-gap)) / 2);
  }
}

@container (min-width: 64rem) {
  .responsive [data-wtcg-list] {
    --wtcg-slides: 4;
    --wtcg-slide-size: calc((100cqw - var(--wtcg-slide-gap) * 3) / 4);
  }
}`,
    viewport: `.viewport {
  --wtcg-slide-gap: 22px;
}

.viewport [data-wtcg-list] {
  --wtcg-slides: 1;
  --wtcg-slide-size: 100cqw;
  border-radius: 0;
}

.demo-viewport > .demo-stage {
  width: 100vw;
  max-width: 100vw;
  margin-inline-start: calc(50% - 50vw);
}`,
    "card-carousel": `.card-carousel {
  --wtcg-slide-gap: 10px;
  --card-width: min(65vw, 20rem);
  --hand-count: 8;
  --hand-slot-gap: 20vw;
  --hand-slot: calc(var(--wtcg-slide-offset, 0) + (var(--hand-count) - 1) / 2);
  --hand-distance: min(var(--wtcg-slide-distance, 0), 4);
  --hand-x: calc((var(--hand-slot) - (var(--hand-count) - 1) / 2) * var(--hand-slot-gap));
  --card-depth: 0.07;
}

.card-carousel [data-wtcg-list] {
  --wtcg-slides: 1;
  --wtcg-slide-size: var(--card-width);
  padding-block: 55px 90px;
  overflow: hidden;
}

.card-carousel .photo-slide {
  position: relative;
  border: 1px solid var(--color-black-25);
  border-radius: 8px;
  box-shadow: 0 22px 32px #1018202b;
  transform: translateX(calc(var(--wtcg-slide-offset, 0) * -1 * var(--card-width)))
    translateY(calc(min(var(--wtcg-slide-distance, 0), 4) * 7px))
    rotate(calc(var(--wtcg-slide-offset, 0) * 2deg))
    scale(calc(1 - min(var(--wtcg-slide-distance, 0), 4) * var(--card-depth)));
  opacity: calc(1 - min(var(--wtcg-slide-distance, 0), 4) * 0.12);
  z-index: calc(50 - var(--wtcg-slide-distance, 0));
  transition:
    transform 500ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 500ms ease;
}

.card-carousel [data-wtcg-track] {
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* MANDATORY: suppress the track during instant corrections and pointer drag. */
.card-carousel[data-wtcg-dragging] [data-wtcg-track],
.card-carousel[data-wtcg-instant] [data-wtcg-track],
/* MANDATORY: suppress animated card properties in the same states. */
.card-carousel[data-wtcg-dragging] .photo-slide,
.card-carousel[data-wtcg-instant] .photo-slide {
  transition: none;
}`,
    "focus-center": `.focus-center {
  container-type: inline-size;
  --focus-slide-width: clamp(240px, 31cqw, 380px);
  --focus-gap: 25px;
  --focus-active-scale: 1.1;
  --focus-rest-scale: 0.9;
  --wtcg-slide-gap: var(--focus-gap);
  --wtcg-center-padding: 5vw;
}

.focus-center [data-wtcg-list] {
  --wtcg-slides: 3;
  --wtcg-slide-size: var(--focus-slide-width);
  padding-block: 55px;
  overflow: visible;
}

.focus-center [data-wtcg-slide] {
  width: var(--focus-slide-width);
  --focus-distance: min(var(--wtcg-slide-distance, 0), 1);
  --focus-direction: clamp(-1, var(--wtcg-slide-offset, 0), 1);
  transform: translateX(
    calc(
      var(--wtcg-slide-offset, 0) * (var(--focus-rest-scale) - 1) * var(--focus-slide-width) +
        var(--focus-direction) * (var(--focus-active-scale) - var(--focus-rest-scale)) *
          var(--focus-slide-width) / 2
    )
  );
  transition: transform 300ms ease;
}

.focus-center .photo-slide {
  width: 100%;
  opacity: calc(1 - var(--focus-distance) * 0.25);
  transform: scale(
    calc(
      var(--focus-active-scale) -
        var(--focus-distance) * (var(--focus-active-scale) - var(--focus-rest-scale))
    )
  );
  transform-origin: center;
  transition:
    opacity 300ms ease,
    transform 300ms ease;
}

.focus-center [data-wtcg-track] {
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* MANDATORY: suppress the track during instant corrections and pointer drag. */
.focus-center[data-wtcg-instant] [data-wtcg-track],
.focus-center[data-wtcg-dragging] [data-wtcg-track] {
  transition: none;
}

/* MANDATORY: suppress animated focus properties in the same states. */
.focus-center[data-wtcg-dragging] [data-wtcg-slide],
.focus-center[data-wtcg-instant] [data-wtcg-slide],
.focus-center[data-wtcg-dragging] .photo-slide,
.focus-center[data-wtcg-instant] .photo-slide {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .focus-center [data-wtcg-track],
  .focus-center [data-wtcg-slide],
  .focus-center .photo-slide {
    transition: none;
  }
}`,
    interactive: `.interactive [data-wtcg-list] {
  --wtcg-slides: 2;
  --wtcg-slide-size: calc((100cqw - var(--wtcg-slide-gap)) / 2);
  overflow: visible;
}

.story-slide {
  min-height: 340px;
  background: var(--ink);
  color: white;
}

.slide-actions a,
.slide-actions button {
  border: 1px solid #758095;
}`,
    fan: `.fan {
  --wtcg-slide-gap: 0;
  --wtcg-center-padding: 8vw;
  --hand-card-width: min(65vw, 20rem);
  --hand-count: 8;
  --hand-slot-gap: 20vw;
  --hand-slot: calc(var(--wtcg-slide-offset, 0) + (var(--hand-count) - 1) / 2);
  --hand-distance: min(var(--wtcg-slide-distance, 0), 3);
  --hand-x: calc((var(--hand-slot) - (var(--hand-count) - 1) / 2) * var(--hand-slot-gap));
}

.fan [data-wtcg-list] {
  --wtcg-slides: 3;
  --wtcg-slide-size: var(--hand-card-width);
  padding-block: 45px 70px;
  overflow: visible;
}

.fan [data-wtcg-track] {
  transition: transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.feature-fan .fan .photo-slide {
  border: 1px solid var(--line);
  transform: translateX(var(--hand-x)) translateY(calc(var(--hand-distance) * 12px))
    rotate(calc(var(--wtcg-slide-offset, 0) * 8deg));
  opacity: calc(1 - var(--hand-distance) * 0.16);
  transition:
    transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 520ms ease;
}

/* MANDATORY: suppress the track during instant corrections and pointer drag. */
.fan[data-wtcg-instant] [data-wtcg-track],
.fan[data-wtcg-dragging] [data-wtcg-track],
/* MANDATORY: suppress animated card properties in the same states. */
.fan[data-wtcg-dragging] .photo-slide,
.fan[data-wtcg-instant] .photo-slide {
  transition: none;
}`,
  })[className];
const snippet = (className, options, count = 4) => ({
  markup: markupFor(className, count, Boolean(options.pagination)),
  styles: styleFor(className),
  script: formatOptions(options),
  count,
});
const demos = [
  { title: "Basic", className: "basic", options: {}, slides: LANDSCAPE_IMAGES },
  {
    title: "Different image sizes",
    className: "natural",
    options: {
      centerMode: true,
      drag: "free",
      focusOnSelect: true,
      initialSlide: 2,
    },
    slides: NATURAL_IMAGES,
  },
  {
    title: "Responsive slide count",
    className: "responsive",
    options: { pagination: true, infinite: false },
    slides: DEMO_IMAGES,
  },
  {
    title: "Viewport-width carousel",
    className: "viewport",
    options: { pagination: true, infinite: true },
    slides: FULL_WIDTH_IMAGES,
  },
  {
    title: "A stacked card carousel",
    className: "card-carousel",
    options: fanOptions,
    slides: LANDSCAPE_IMAGES,
  },
  {
    title: "Centered focus",
    className: "focus-center",
    options: {
      centerMode: true,
      pagination: true,
      drag: false,
      focusOnSelect: true,
    },
    slides: LANDSCAPE_IMAGES,
  },
  {
    title: "Interactive slide content",
    className: "interactive",
    options: { pagination: true, infinite: true },
    slides: DEMO_IMAGES.slice(0, 5),
  },
];
function Demo({ item }) {
  const { title, className, options, slides } = item;
  const code = snippet(className, options, slides.length);
  return (
    <article className={`demo demo-${className}`} id={`demo-${className}`}>
      <div className="demo-intro">
        <h2>{title}</h2>
      </div>
      <CarouselStage
        className={className}
        options={options}
        slides={Array.isArray(slides) ? slides : DEMO_IMAGES}
        title={title}
      />
      <SourceCode
        markup={code.markup}
        styles={code.styles}
        script={code.script}
      />
    </article>
  );
}
function FeatureFan() {
  const code = snippet("fan", fanOptions, LANDSCAPE_IMAGES.length);
  return (
    <section className="feature-fan" aria-label="Featured live demo">
      <CarouselStage
        className="fan"
        options={fanOptions}
        slides={LANDSCAPE_IMAGES}
      />
      <SourceCode
        markup={code.markup}
        styles={code.styles}
        script={code.script}
      />
    </section>
  );
}

// Standalone demos with a page of their own. Each href is relative so it
// resolves under the site's base path.
const MORE_DEMOS = [
  {
    href: "path-carousel/",
    title: "Along the way",
    description: (
      <>
        Slides travel along a winding road with CSS <code>offset-path</code>.
        The carousel still does the snapping; the track is cancelled out so it
        only acts as a positioning origin.
      </>
    ),
  },
];
function MoreDemos() {
  return (
    <section className="demo demo-more" id="more" aria-labelledby="more-title">
      <div className="demo-intro">
        <h2 id="more-title">More</h2>
        <p>Other, less general demos that each get a page of their own.</p>
      </div>
      <dl className="more-list">
        {MORE_DEMOS.map(({ href, title, description }) => (
          <div className="more-item" key={href}>
            <dt>
              <a href={href}>
                {title} <span aria-hidden="true">→</span>
              </a>
            </dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const quickMarkup = `<section data-wtcg-carousel aria-roledescription="carousel" aria-label="Featured items">\n  <div id="featured-carousel-slides" data-wtcg-list>\n    <ul data-wtcg-track>\n      <li data-wtcg-slide>First slide</li>\n      <li data-wtcg-slide>Second slide</li>\n      <li data-wtcg-slide>Third slide</li>\n    </ul>\n  </div>\n  <button data-wtcg-prev type="button">Previous</button>\n</section>`;
const quickJs = `import { WtcGorditoCarousel } from '@wethegit/gordito-carousel';\nimport '@wethegit/gordito-carousel/wtc-gordito-carousel.css';\n\nconst carousel = new WtcGorditoCarousel(document.querySelector('[data-wtcg-carousel]'), {\n  pagination: true,\n});`;
const installCommand = `npm install @wethegit/gordito-carousel`;
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
                  {typeof cell === "string" &&
                  (cell.startsWith("`") || cell.includes("wtcg")) ? (
                    <code>{cell.replaceAll("`", "")}</code>
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
          <h2>Quick start</h2>
          <Snippet label="Install" language="SH">
            {installCommand}
          </Snippet>
          <Snippet label="Required markup" language="HTML">
            {quickMarkup}
          </Snippet>
          <Snippet label="Start" language="JS">
            {quickJs}
          </Snippet>
          <p>
            Options can also be set in markup. Programmatic settings are merged
            first, then <code>data-wtcg</code> overrides them.
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
            headers={["Export", "Purpose"]}
            rows={[
              [<code>WtcGorditoCarousel</code>, "Carousel class."],
              [
                <code>WTC_GORDITO_CAROUSEL_DEFAULTS</code>,
                "Default option object.",
              ],
              [
                <code>WTC_GORDITO_CAROUSEL_STATUS_TOKENS</code>,
                <>
                  <code>{"{current}"}</code> and <code>{"{total}"}</code> status
                  template tokens.
                </>,
              ],
            ]}
          />
        </section>
        <section id="contract">
          <p className="kicker">DOM contract</p>
          <h2>Keep the DOM yours.</h2>
          <p>
            The core never creates wrappers, arrows, pagination, or status
            markup. If optional controls exist and their corresponding option is
            enabled, the core wires behavior. If controls are missing, it does
            nothing.
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
              <code>[data-wtcg-slide]</code>: Slide element. Direct children of
              the track are treated as slides by default.
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
              <code>[data-wtcg-pagination] &gt; * &gt; [data-wtcg-page]</code>:
              Pagination controls.
            </li>
            <li>
              <code>[data-wtcg-status]</code>: Status template for current/total
              text.
            </li>
          </ul>
          <h3>Controls</h3>
          <p>
            Arrows are attach-only controls. Keep <code>arrows</code> enabled
            when you provide arrow markup; <code>arrows: false</code> disables
            arrow behavior. Pagination buttons choose slides; the active button
            receives <code>[data-wtcg-active]</code> and{" "}
            <code>aria-current="true"</code>. Extra buttons use native{" "}
            <code>hidden</code> when fewer positions are reachable.
          </p>
          <h3>Status</h3>
          <p>
            <code>[data-wtcg-status]</code> is an optional template. The author
            owns live-region semantics and localization; tokens are replaced
            with the current logical slide number and total logical slide count.
            Infinite clones are not counted.
          </p>
        </section>
        <section id="accessibility">
          <p className="kicker">Inclusive by default</p>
          <h2>Accessibility</h2>
          <h3>Author responsibilities</h3>
          <ul>
            <li>
              Give the root an accessible name with <code>aria-label</code> or{" "}
              <code>aria-labelledby</code>.
            </li>
            <li>
              Add <code>aria-roledescription="carousel"</code> when useful.
            </li>
            <li>Use native buttons and give controls accessible names.</li>
            <li>Give slides useful accessible names where possible.</li>
            <li>
              Add <code>aria-live="polite"</code> to a dedicated status element
              when announcements are useful.
            </li>
          </ul>
          <h3>Core behavior</h3>
          <ul>
            <li>
              Slides outside the active rendered range are <code>inert</code>{" "}
              and <code>aria-hidden="true"</code>.
            </li>
            <li>
              Active rendered slides receive <code>aria-hidden="false"</code>.
            </li>
            <li>
              During pointer drag, rendered slide state follows the drag
              preview.
            </li>
            <li>
              Pagination, status, events, and committed{" "}
              <code>currentSlide</code> update after release.
            </li>
            <li>
              Pagination exposes <code>aria-current="true"</code>; previous and
              next expose native <code>disabled</code> and{" "}
              <code>aria-disabled</code>.
            </li>
            <li>
              Static roles, labels, roledescriptions, and control relationships
              remain author markup.
            </li>
          </ul>
        </section>
        <section id="css-model">
          <p className="kicker">CSS model / advanced styling</p>
          <h2>CSS owns the animation.</h2>
          <p>
            Library CSS is structural, uses low-specificity{" "}
            <code>:where([data-wtcg-*])</code> selectors inside{" "}
            <code>@layer wtc-gordito-carousel</code>, and can be overridden by
            ordinary app CSS.
          </p>
          <Snippet label="Basic transition" language="CSS">
            {
              "[data-wtcg-track] { transition: transform 400ms ease; }\n[data-wtcg-carousel][data-wtcg-instant] [data-wtcg-track],\n[data-wtcg-carousel][data-wtcg-dragging] [data-wtcg-track] { transition: none; }\n@media (prefers-reduced-motion: reduce) { [data-wtcg-track] { transition: none; } }"
            }
          </Snippet>
          <h3>Two suppression states</h3>
          <Table
            headers={["Attribute", "Element", "When set"]}
            rows={[
              [
                <code>[data-wtcg-instant]</code>,
                "Carousel root",
                "Invisible position corrections: initial layout, responsive refresh, and infinite-loop clone normalization.",
              ],
              [
                <code>[data-wtcg-dragging]</code>,
                "Carousel root",
                "Active pointer drag — the track must follow the pointer, not animate.",
              ],
            ]}
          />
          <p>
            <strong>
              Neither attribute should affect slide-level transitions
            </strong>{" "}
            such as opacity and scale.
          </p>
          <h3>Mandatory suppression rules</h3>
          <p className="warning">
            ⚠ If you override the track transition, you MUST also restore both
            suppression rules. Otherwise the carousel can jank during drag and
            visible clone corrections. Consumer CSS with non-zero specificity or
            unlayered CSS can override them accidentally.
          </p>
          <Snippet label="Required override" language="CSS">
            {suppressCss}
          </Snippet>
          <h3 id="responsive">Responsive behavior</h3>
          <p>
            Responsive behavior is CSS-first. Change custom properties with
            media queries or container queries; the core watches size changes
            and recalculates from rendered DOM layout.
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
            headers={["Variable", "Purpose", "Default"]}
            rows={[
              [
                <code>--wtcg-slides</code>,
                "Number of slides treated as visible/active.",
                "1",
              ],
              [
                <code>--wtcg-scroll</code>,
                "Slides advanced by arrows and fixed drag.",
                "1",
              ],
              [
                <code>--wtcg-slide-size</code>,
                "Width applied to each slide; core measures rendered boxes.",
                "auto",
              ],
              [
                <code>--wtcg-slide-gap</code>,
                "Track gap between adjacent slide boxes.",
                "0px",
              ],
              [
                <code>--wtcg-center-padding</code>,
                "List inline padding in center mode.",
                "0px",
              ],
              [
                <code>--wtcg-pagination-gap</code>,
                "Gap between pagination controls.",
                "0.5rem",
              ],
            ]}
          />
          <h3>Runtime slide variables</h3>
          <Table
            headers={["Variable", "Purpose"]}
            rows={[
              [
                <code>--wtcg-slide-index</code>,
                "Original slide index, normalized to original count.",
              ],
              [
                <code>--wtcg-slide-render-index</code>,
                "Rendered index including clones.",
              ],
              [
                <code>--wtcg-slide-offset</code>,
                "Signed distance from active rendered slide; fractional during drag.",
              ],
              [
                <code>--wtcg-slide-distance</code>,
                "Absolute distance; fractional during drag.",
              ],
              [<code>--wtcg-slide-side</code>, "Direction: -1, 0, or 1."],
            ]}
          />
          <h3>State attributes</h3>
          <p>
            <code>data-wtcg-initialized</code>, <code>data-wtcg-active</code>,{" "}
            <code>data-wtcg-current</code>, <code>data-wtcg-center</code>,{" "}
            <code>data-wtcg-draggable</code>, <code>data-wtcg-dragging</code>,
            and <code>data-wtcg-instant</code> are core-owned state. They
            describe initialization, visible/current slides, center mode, drag
            capability, active drag, and non-animated transforms.
          </p>
        </section>
        <section id="infinite">
          <p className="kicker">Infinite looping</p>
          <h2>Bounded clone loops.</h2>
          <p>
            Infinite mode creates one or more full logical slide sets before and
            after the originals, animates across an edge, then aligns back with{" "}
            <code>[data-wtcg-instant]</code>. DOM growth is bounded, original
            order is preserved, repeated order stays consistent, and
            variable-width slides remain measurable. Inactive duplicate rendered
            slides stay <code>aria-hidden</code> and <code>inert</code>; status
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
            headers={["Option", "Type", "Description"]}
            rows={[
              [
                <code>adaptiveHeight</code>,
                "boolean",
                "When slides resolves to 1, match list height to current slide.",
              ],
              [
                <code>arrows</code>,
                "boolean | string | HTMLElement",
                "Attach existing previous/next controls; true searches the root.",
              ],
              [
                <code>centerMode</code>,
                "boolean",
                "Center current slide and allow partial neighbors.",
              ],
              [
                <code>pagination</code>,
                "boolean | string | HTMLElement",
                "Attach existing pagination controls.",
              ],
              [
                <code>drag</code>,
                'boolean | "fixed" | "free"',
                "Disable drag, advance fixed, or snap to nearest reached slide.",
              ],
              [
                <code>edgeFriction</code>,
                "number",
                "Dampening past a non-infinite edge.",
              ],
              [
                <code>focusOnSelect</code>,
                "boolean",
                "Clicking a slide moves it current.",
              ],
              [
                <code>focusOnChange</code>,
                "boolean",
                "Move browser focus after each change; use carefully.",
              ],
              [
                <code>infinite</code>,
                "boolean",
                "Clone edge slides so movement wraps.",
              ],
              [
                <code>initialSlide</code>,
                "number",
                "Zero-based initial original index.",
              ],
              [
                <code>slide</code>,
                "string",
                "Selector narrowing participating direct slides.",
              ],
              [
                <code>touchThreshold</code>,
                "number",
                "Swipe threshold fraction; 5 means one-fifth width.",
              ],
              [
                <code>waitForAnimate</code>,
                "boolean",
                "Ignore requests during a transition.",
              ],
            ]}
          />
        </section>
        <section id="methods">
          <p className="kicker">Imperative API</p>
          <h2>Methods & accessors</h2>
          <Table
            headers={["Method", "Description"]}
            rows={[
              [<code>next(event?)</code>, "Advance by --wtcg-scroll."],
              [<code>prev(event?)</code>, "Move backward by --wtcg-scroll."],
              [
                <code>goTo(index, dontAnimate = false)</code>,
                "Move to an original slide index.",
              ],
              [<code>getOption(option)</code>, "Return a runtime option."],
              [
                <code>setOption(option, value, refresh = false)</code>,
                "Update one option.",
              ],
              [
                <code>setOption(options, refresh = false)</code>,
                "Update multiple options.",
              ],
              [
                <code>refresh(initializing = false)</code>,
                "Rebuild from current DOM and options.",
              ],
              [
                <code>destroy(refresh = false)</code>,
                "Remove clones/listeners/state and restore originals.",
              ],
              [
                <code>addSlide(markup, index?, addBefore?)</code>,
                "Add one slide and rebuild.",
              ],
              [
                <code>removeSlide(index, removeBefore?, removeAll?)</code>,
                "Remove one or all slides and rebuild.",
              ],
              [
                <code>filterSlides(filter)</code>,
                "Filter by selector or predicate and rebuild.",
              ],
              [
                <code>unfilterSlides()</code>,
                "Clear active filter and rebuild.",
              ],
              [
                <code>WtcGorditoCarousel.initAll(selector?, options?)</code>,
                "Initialize all matching elements.",
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
            Events are bubbling <code>CustomEvent</code>s dispatched on the
            carousel root with the <code>wtcg:</code> prefix.
          </p>
          <Table
            headers={["Event", "Detail"]}
            rows={[
              [<code>wtcg:init</code>, "{ carousel }"],
              [
                <code>wtcg:beforeChange</code>,
                "{ carousel, currentSlide, nextSlide }",
              ],
              [<code>wtcg:afterChange</code>, "{ carousel, currentSlide }"],
              [<code>wtcg:reInit</code>, "{ carousel }"],
              [<code>wtcg:setPosition</code>, "{ carousel }"],
              [<code>wtcg:swipe</code>, "{ carousel, direction }"],
              [<code>wtcg:destroy</code>, "{ carousel, refresh }"],
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
          <a href="#more">More demos</a>
          <a href="#docs">Docs</a>
          <a href="#contract">DOM contract</a>
          <a
            className="github"
            href="https://github.com/wethegit/gordito-carousel"
          >
            GitHub ↗
          </a>
        </nav>
      </header>
      <main id="top">
        <section className="identity">
          <h1>
            WTC Gordito Carousel <span>🐽</span>
          </h1>
          <p>
            A small vanilla carousel core with an explicit DOM contract. The
            library owns behavior, runtime state, and measurement. Authors own
            markup, semantics, layout styling, and animation.
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
          </div>
        </section>
        {demos.map((item) => (
          <Demo key={item.className} item={item} />
        ))}
        <MoreDemos />
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
createRoot(document.getElementById("root")).render(<App />);
