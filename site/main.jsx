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
const imageUrl = (image, size = `${image.w}/${image.h}`) =>
  `https://picsum.photos/id/${image.id}/${size}`;

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const fallbackCopy = () => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let successful = false;
    try {
      successful = document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
    return successful;
  };
  const copy = async () => {
    setCopyError(false);
    let successful = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        successful = true;
      }
    } catch {
      successful = false;
    }
    if (!successful) {
      try {
        successful = fallbackCopy();
      } catch {
        successful = false;
      }
    }
    if (successful) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 2200);
    }
  };
  return (
    <button className="copy-button" type="button" onClick={copy} aria-label="Copy snippet">
      {copied ? 'Copied' : copyError ? 'Copy failed' : 'Copy'}
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
function Slide({ image, index, interactive = false }) {
  if (interactive)
    return (
      <li
        className="story-slide"
        data-wtcg-slide
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of 5`}
      >
        <img src={imageUrl(image, '720/480')} alt="" />
        <div>
          <small>Field note / 0{index + 1}</small>
          <h3>{image.title}</h3>
          <p>A small pause in the middle of the day. Only the visible story is tabbable.</p>
          <div className="slide-actions">
            <a href="#details">Read more</a>
            <button type="button">Save slide</button>
          </div>
        </div>
      </li>
    );
  return (
    <li data-wtcg-slide role="group" aria-roledescription="slide" aria-label={`${index + 1} of 8`}>
      <figure
        className="photo-slide"
        style={{
          '--ratio': `${image.w} / ${image.h}`,
          '--asset-width': `${Math.min(28, Math.max(15, (image.w / image.h) * 18))}rem`,
        }}
      >
        <img
          src={imageUrl(image)}
          width={image.w}
          height={image.h}
          alt={image.title}
          loading={index < 2 ? 'eager' : 'lazy'}
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
function Controls({ id, count, arrowsInPagination = false }) {
  return (
    <div className="controls" role="group" aria-label="Choose slide">
      <ol data-wtcg-pagination>
        {arrowsInPagination && (
          <li>
            <button data-wtcg-prev type="button" aria-controls={id}>
              ← <span>Prev</span>
            </button>
          </li>
        )}
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <button data-wtcg-page type="button" aria-label={`Slide ${index + 1}`}>
              {String(index + 1).padStart(2, '0')}
            </button>
          </li>
        ))}
        {arrowsInPagination && (
          <li>
            <button data-wtcg-next type="button" aria-controls={id}>
              <span>Next</span> →
            </button>
          </li>
        )}
      </ol>
    </div>
  );
}

const HERO_OPTIONS = {
  centerMode: true,
  drag: 'free',
  focusOnSelect: true,
  infinite: true,
};

function HeroCarousel() {
  const ref = useRef(null);
  const listId = useId();
  const titleId = useId();
  const heroImages = IMAGES.slice(0, 4);
  useEffect(() => {
    const carousel = new WtcGorditoCarousel(ref.current, HERO_OPTIONS);
    return () => carousel.destroy();
  }, []);
  return (
    <div className="hero-orbit">
      <div
        className="hero-carousel"
        data-wtcg-carousel
        role="region"
        aria-roledescription="carousel"
        aria-labelledby={titleId}
        ref={ref}
      >
        <h2 className="sr-only" id={titleId}>
          Gordito carousel preview
        </h2>
        <div data-wtcg-list id={listId}>
          <ul data-wtcg-track>
            {heroImages.map((image, index) => (
              <li
                className="hero-slide"
                data-wtcg-slide
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${heroImages.length}`}
                key={image.id}
              >
                <div className="orbit-card">
                  <span>
                    0{index + 1} / 0{heroImages.length}
                  </span>
                  <img src={imageUrl(image, '900/620')} alt={image.title} />
                  <b>{image.title}</b>
                  <em>{image.place}</em>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <button
          className="hero-arrow prev"
          data-wtcg-prev
          type="button"
          aria-controls={listId}
          aria-label="Previous preview slide"
        >
          ←
        </button>
        <button
          className="hero-arrow next"
          data-wtcg-next
          type="button"
          aria-controls={listId}
          aria-label="Next preview slide"
        >
          →
        </button>
        <div className="hero-pagination" role="group" aria-label="Choose preview slide">
          <ol data-wtcg-pagination>
            {heroImages.map((image, index) => (
              <li key={image.id}>
                <button data-wtcg-page type="button" aria-label={`Slide ${index + 1}`}>
                  {index + 1}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <p className="sr-only" data-wtcg-status aria-live="polite" aria-atomic="true">
          Slide {WTC_GORDITO_CAROUSEL_STATUS_TOKENS.CURRENT} of{' '}
          {WTC_GORDITO_CAROUSEL_STATUS_TOKENS.TOTAL}
        </p>
      </div>
      <div className="orbit-stamp">
        drag
        <br />→<br />
        release
      </div>
    </div>
  );
}

function Demo({
  number,
  eyebrow,
  title,
  description,
  options,
  className = '',
  slides = IMAGES,
  interactive = false,
  arrowsInPagination = false,
  markup,
  styles,
  script,
  full = false,
}) {
  const ref = useRef(null);
  const titleId = useId();
  const listId = useId();
  useEffect(() => {
    const carousel = new WtcGorditoCarousel(ref.current, options);
    return () => carousel.destroy();
  }, [options]);
  const showArrows = options?.arrows !== false && !arrowsInPagination;
  return (
    <article className={`demo ${full ? 'demo-full' : ''}`} id={`demo-${number}`}>
      <div className="demo-intro">
        <div className="eyebrow">
          <span>{number}</span>
          {eyebrow}
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="option-pills">
          {Object.entries(options || {}).map(([key, value]) => (
            <code key={key}>
              {key}: {String(value)}
            </code>
          ))}
        </div>
      </div>
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
            {slides.map((image, index) => (
              <Slide key={image.id} image={image} index={index} interactive={interactive} />
            ))}
          </ul>
        </div>
        {showArrows && (
          <>
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
          </>
        )}
        {(options?.pagination || arrowsInPagination) && (
          <Controls id={listId} count={slides.length} arrowsInPagination={arrowsInPagination} />
        )}
        <p className="sr-only" data-wtcg-status aria-live="polite" aria-atomic="true">
          Slide {WTC_GORDITO_CAROUSEL_STATUS_TOKENS.CURRENT} of{' '}
          {WTC_GORDITO_CAROUSEL_STATUS_TOKENS.TOTAL}
        </p>
      </div>
      <div className="snippets">
        <Snippet label="Markup" language="HTML">
          {markup}
        </Snippet>
        <Snippet label="Styles" language="CSS">
          {styles}
        </Snippet>
        <Snippet label="JavaScript / TypeScript" language="JS">
          {script}
        </Snippet>
      </div>
    </article>
  );
}
const snippetSet = ({
  className,
  options,
  count,
  pagination = false,
  arrowsInPagination = false,
  interactive = false,
  responsive = false,
  deck = false,
  fan = false,
  cardCarousel = false,
}) => {
  const arrows = arrowsInPagination
    ? '    <li><button data-wtcg-prev>← Prev</button></li>\n'
    : '  <button data-wtcg-prev>Previous</button>\n  <button data-wtcg-next>Next</button>\n';
  const pages =
    pagination || arrowsInPagination
      ? `    <ol data-wtcg-pagination>\n${arrowsInPagination ? arrows : ''}${Array.from({ length: count }, (_, index) => `      <li><button data-wtcg-page aria-label="Slide ${index + 1}">${String(index + 1).padStart(2, '0')}</button></li>`).join('\n')}\n${arrowsInPagination ? '    <li><button data-wtcg-next>Next →</button></li>\n' : ''}    </ol>`
      : '';
  const slide = interactive
    ? '    <li className="story-slide" data-wtcg-slide>\n      <img alt="" />\n      <div><small>Field note</small><h3>Slide title</h3><p>Slide content</p><a href="#details">Read more</a><button>Save slide</button></div>\n    </li>'
    : '    <li data-wtcg-slide><figure className="photo-slide"><img alt="Slide title" /><figcaption>Slide title</figcaption></figure></li>';
  const style = deck
    ? `.deck [data-wtcg-list] { --wtcg-slide-size: var(--card); overflow: visible; }\n.deck [data-wtcg-track] { transition: transform 500ms cubic-bezier(.22, 1, .36, 1); }\n.deck .photo-slide { transform: rotate(clamp(-80deg, calc(var(--wtcg-slide-offset, 0) * 9deg), 80deg)); transition: transform 500ms cubic-bezier(.22, 1, .36, 1); }\n.deck[data-wtcg-dragging] .photo-slide, .deck[data-wtcg-instant] .photo-slide { transition: none; }`
    : fan
      ? `.fan [data-wtcg-list] { --wtcg-slides: 3; --wtcg-slide-size: clamp(170px, 24cqw, 290px); overflow: visible; padding-block: 45px 70px; }
.fan [data-wtcg-track] { transition: transform 520ms cubic-bezier(.22, 1, .36, 1); }
.fan .photo-slide { transform: translateY(calc(min(var(--wtcg-slide-distance, 0), 3) * 12px)) rotate(calc(var(--wtcg-slide-offset, 0) * 8deg)); opacity: calc(1 - min(var(--wtcg-slide-distance, 0), 3) * .16); transition: transform 520ms cubic-bezier(.22, 1, .36, 1), opacity 520ms ease; }
.fan[data-wtcg-dragging] [data-wtcg-track], .fan[data-wtcg-instant] [data-wtcg-track], .fan[data-wtcg-dragging] .photo-slide, .fan[data-wtcg-instant] .photo-slide { transition: none; }`
      : cardCarousel
        ? `.card-carousel [data-wtcg-list] { --wtcg-slides: 3; --wtcg-slide-size: clamp(180px, 24cqw, 300px); overflow: visible; padding-block: 55px 90px; }
.card-carousel [data-wtcg-track] { transition: transform 500ms cubic-bezier(.22, 1, .36, 1); }
.card-carousel .photo-slide { transform: translateX(calc(var(--wtcg-slide-offset, 0) * -1 * var(--card-width) + sin(calc(var(--wtcg-slide-offset, 0) * 12deg)) * var(--card-radius))) translateY(calc((1 - cos(calc(var(--wtcg-slide-offset, 0) * 12deg))) * var(--card-drop))) rotate(calc(var(--wtcg-slide-offset, 0) * 7deg)) scale(calc(1 - min(var(--wtcg-slide-distance, 0), 4) * var(--card-depth))); opacity: calc(1 - min(var(--wtcg-slide-distance, 0), 4) * .12); transition: transform 500ms cubic-bezier(.22, 1, .36, 1), opacity 500ms ease; }
.card-carousel[data-wtcg-dragging] [data-wtcg-track], .card-carousel[data-wtcg-instant] [data-wtcg-track], .card-carousel[data-wtcg-dragging] .photo-slide, .card-carousel[data-wtcg-instant] .photo-slide { transition: none; }`
        : responsive
          ? `.responsive [data-wtcg-list] { --wtcg-slides: 1; --wtcg-slide-size: 100cqw; }\n@container (min-width: 42rem) { .responsive [data-wtcg-list] { --wtcg-slides: 2; } }\n@container (min-width: 64rem) { .responsive [data-wtcg-list] { --wtcg-slides: 4; } }`
          : className === 'natural'
            ? `.natural [data-wtcg-list] { --wtcg-slides: 3; --wtcg-slide-size: auto; }\n.natural .photo-slide { width: var(--asset-width); }`
            : className === 'center'
              ? `.center [data-wtcg-list] { --wtcg-slides: 3; --wtcg-slide-size: auto; padding-block: 55px; }\n.center .photo-slide { width: clamp(240px, 31cqw, 380px); transform: scale(calc(1 - min(var(--wtcg-slide-distance, 0), 2) * .1)); }`
              : className === 'interactive'
                ? `.interactive [data-wtcg-list] { --wtcg-slides: 2; --wtcg-scroll: 2; --wtcg-slide-size: calc((100cqw - var(--wtcg-slide-gap)) / 2); overflow: visible; }\n.story-slide { display: grid; grid-template-columns: 1fr 1fr; }`
                : `.${className} [data-wtcg-list] { --wtcg-slides: 1; --wtcg-slide-size: 100cqw; }`;
  return {
    markup: `<section class="${className}" data-wtcg-carousel>\n  <div data-wtcg-list><ul data-wtcg-track>\n${slide}\n  </ul></div>\n${arrowsInPagination ? '' : arrows}${pages ? `  <div role="group" aria-label="Choose slide">\n${pages}\n  </div>` : ''}\n</section>`,
    styles: style,
    script:
      options === undefined
        ? 'const carousel = new WtcGorditoCarousel(element);'
        : `const carousel = new WtcGorditoCarousel(element, ${JSON.stringify(options)});`,
  };
};
const basic = snippetSet({ className: 'basic', count: 5 });
const natural = snippetSet({
  className: 'natural',
  count: 8,
  options: { centerMode: true, drag: 'free', focusOnSelect: true, initialSlide: 2 },
});
const center = snippetSet({
  className: 'center',
  count: 8,
  pagination: true,
  options: { centerMode: true, pagination: true, drag: 'free', focusOnSelect: true },
});
const infinite = snippetSet({
  className: 'infinite',
  count: 6,
  pagination: true,
  arrowsInPagination: true,
  options: { pagination: true, infinite: true },
});
const responsive = snippetSet({
  className: 'responsive',
  count: 8,
  pagination: true,
  responsive: true,
  options: { pagination: true, infinite: false },
});
const viewport = snippetSet({
  className: 'viewport',
  count: 8,
  pagination: true,
  options: { pagination: true, infinite: true },
});
const deck = snippetSet({
  className: 'deck',
  count: 8,
  pagination: true,
  deck: true,
  options: {
    centerMode: true,
    pagination: true,
    drag: 'free',
    focusOnSelect: true,
    infinite: true,
    initialSlide: 2,
  },
});
const fan = snippetSet({
  className: 'fan',
  count: 8,
  pagination: true,
  fan: true,
  options: {
    centerMode: true,
    pagination: true,
    drag: 'free',
    focusOnSelect: true,
    infinite: true,
    initialSlide: 1,
  },
});
const cardCarousel = snippetSet({
  className: 'card-carousel',
  count: 8,
  pagination: true,
  cardCarousel: true,
  options: {
    centerMode: true,
    pagination: true,
    drag: 'free',
    focusOnSelect: true,
    infinite: true,
    initialSlide: 2,
  },
});
const interactive = snippetSet({
  className: 'interactive',
  count: 5,
  pagination: true,
  interactive: true,
  options: { pagination: true, infinite: true },
});

function App() {
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">G</span> gordito
        </a>
        <nav>
          <a href="#demos">Demos</a>
          <a href="#contract">DOM contract</a>
          <a className="github" href="https://github.com/wethegit/gordito-carousel">
            GitHub ↗
          </a>
        </nav>
      </header>
      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">A small vanilla carousel core</p>
            <h1>
              Make movement
              <br />
              <i>explicit.</i>
            </h1>
            <p className="hero-lede">
              Gordito owns behavior, state, and measurement. You own the markup, semantics, and
              visual language.
            </p>
            <a className="primary-cta" href="#demos">
              Explore the demos <span>↓</span>
            </a>
          </div>
          <HeroCarousel />
        </section>
        <section className="principles">
          <p className="kicker">The shape of the API</p>
          <div className="principle-grid">
            <div>
              <span>01</span>
              <h3>Explicit markup</h3>
              <p>No generated wrappers or controls. The DOM stays yours.</p>
            </div>
            <div>
              <span>02</span>
              <h3>CSS-first layout</h3>
              <p>Use variables and media queries for responsive slide sizing.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Quietly accessible</h3>
              <p>Inert inactive slides, live status, and native controls included.</p>
            </div>
          </div>
        </section>
        <section className="gallery-head" id="demos">
          <div>
            <p className="kicker">The demo gallery</p>
            <h2>
              Ten ways to
              <br />
              <i>move through</i> content.
            </h2>
          </div>
          <p>
            Every example below uses the same DOM contract. Resize, drag, tab, and inspect the
            snippets to see the pieces in context.
          </p>
        </section>
        <Demo
          number="01"
          eyebrow="Defaults"
          title="Bare minimum basics"
          description="The default behavior advances one image at a time and wires existing previous/next buttons."
          className="basic"
          markup={basic.markup}
          styles={basic.styles}
          script={basic.script}
          slides={IMAGES.slice(0, 5)}
        />
        <Demo
          number="02"
          eyebrow="Natural sizes"
          title="Different image sizes"
          description="Keep each image's natural width with auto-sized slides. Center mode keeps the active image in view."
          options={{ centerMode: true, drag: 'free', focusOnSelect: true, initialSlide: 2 }}
          className="natural"
          markup={natural.markup}
          styles={natural.styles}
          script={natural.script}
        />
        <Demo
          number="03"
          eyebrow="Center mode"
          title="Live drag emphasis"
          description="Drag slowly to see active state and fractional runtime variables update with the pointer."
          options={{ centerMode: true, pagination: true, drag: 'free', focusOnSelect: true }}
          className="center"
          markup={center.markup}
          styles={center.styles}
          script={center.script}
        />
        <Demo
          number="04"
          eyebrow="Flexible controls"
          title="Arrows inside pagination"
          description="Previous and next can live in the same list as pagination buttons."
          options={{ pagination: true, infinite: true }}
          arrowsInPagination
          className="infinite"
          slides={IMAGES.slice(0, 6)}
          markup={infinite.markup}
          styles={infinite.styles}
          script={infinite.script}
        />
        <Demo
          number="05"
          eyebrow="Responsive CSS"
          title="Responsive slide count"
          description="Resize the browser. Container queries change the number of visible slides while the core refreshes measurements."
          options={{ pagination: true, infinite: false }}
          className="responsive"
          markup={responsive.markup}
          styles={responsive.styles}
          script={responsive.script}
        />
        <Demo
          number="06"
          eyebrow="Full width"
          title="Viewport-width carousel"
          description="Break out of the reading column without changing the markup or API."
          options={{ pagination: true, infinite: true }}
          className="viewport"
          full
          markup={viewport.markup}
          styles={viewport.styles}
          script={viewport.script}
        />
        <Demo
          number="07"
          eyebrow="CSS math"
          title="Infinite card deck"
          description="A looping deck where cards sit on a soft circular arc using CSS trig functions and runtime variables."
          options={{
            centerMode: true,
            pagination: true,
            drag: 'free',
            focusOnSelect: true,
            infinite: true,
            initialSlide: 2,
          }}
          className="deck"
          full
          markup={deck.markup}
          styles={deck.styles}
          script={deck.script}
        />
        <Demo
          number="08"
          eyebrow="Card fan"
          title="A fan that follows the pointer"
          description="Cards keep their own angle and depth while the track follows the drag. Release to settle on the nearest card."
          options={{
            centerMode: true,
            pagination: true,
            drag: 'free',
            focusOnSelect: true,
            infinite: true,
            initialSlide: 1,
          }}
          className="fan"
          full
          markup={fan.markup}
          styles={fan.styles}
          script={fan.script}
        />
        <Demo
          number="09"
          eyebrow="Card carousel"
          title="A carousel with a little depth"
          description="A compact card row uses the slide offset to arc, lift, and fade neighboring cards without leaving the carousel contract."
          options={{
            centerMode: true,
            pagination: true,
            drag: 'free',
            focusOnSelect: true,
            infinite: true,
            initialSlide: 2,
          }}
          className="card-carousel"
          full
          markup={cardCarousel.markup}
          styles={cardCarousel.styles}
          script={cardCarousel.script}
        />
        <Demo
          number="10"
          eyebrow="Focus"
          title="Interactive slide content"
          description="Only the active rendered range is tabbable. Try tabbing through the slide, then drag it away."
          options={{ pagination: true, infinite: true }}
          className="interactive"
          slides={IMAGES.slice(0, 5)}
          interactive
          markup={interactive.markup}
          styles={interactive.styles}
          script={interactive.script}
        />
        <section className="contract" id="contract">
          <div>
            <p className="kicker">Start with the contract</p>
            <h2>
              Three hooks.
              <br />
              <i>One clear core.</i>
            </h2>
          </div>
          <div className="contract-list">
            <p>
              <code>[data-wtcg-carousel]</code>
              <span>The root. Add a name and a roledescription.</span>
            </p>
            <p>
              <code>[data-wtcg-list] → [data-wtcg-track]</code>
              <span>The viewport and the moving track.</span>
            </p>
            <p>
              <code>[data-wtcg-slide]</code>
              <span>Direct children become slides. Controls are optional.</span>
            </p>
          </div>
        </section>
      </main>
      <footer>
        <span className="brand">
          <span className="brand-mark">G</span> gordito
        </span>
        <span>Small core. Explicit surface.</span>
      </footer>
    </>
  );
}
createRoot(document.getElementById('root')).render(<App />);
