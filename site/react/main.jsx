import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Highlight } from 'prism-react-renderer';
import InteractiveGallery from './examples/InteractiveGallery.jsx';
import EditableGallery from './examples/EditableGallery.jsx';
import SelectableGallery from './examples/SelectableGallery.jsx';
import interactiveSource from './examples/InteractiveGallery.jsx?raw';
import editableSource from './examples/EditableGallery.jsx?raw';
import selectableSource from './examples/SelectableGallery.jsx?raw';

import '../styles.css';
import './styles.css';
import './examples.css';

const sourceTheme = {
  plain: { color: '#101820', backgroundColor: '#f6f8fa' },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#52606d' },
    },
    {
      types: ['keyword', 'boolean', 'tag', 'selector'],
      style: { color: '#7f0315' },
    },
    { types: ['string', 'attr-value'], style: { color: '#144d5b' } },
    {
      types: ['function', 'class-name', 'attr-name'],
      style: { color: '#081c81' },
    },
    { types: ['number', 'constant'], style: { color: '#742a89' } },
  ],
};

function Source({ title, source }) {
  const [copyState, setCopyState] = useState('Copy');
  const timer = useRef(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const text = source
    .replaceAll('../../../src/react/index.tsx', '@wethegit/gordito-carousel/react')
    .trim();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('Copied');
    } catch {
      setCopyState('Select the code to copy');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopyState('Copy'), 2000);
  }

  return (
    <details className="react-source">
      <summary>{title}</summary>
      <div className="react-source-toolbar">
        <span>React · JSX</span>
        <button type="button" aria-label={`Copy ${title}`} onClick={copy}>
          {copyState}
        </button>
        <span className="sr-only" role="status">
          {copyState === 'Copy' ? '' : copyState}
        </span>
      </div>
      <Highlight code={text} language="jsx" theme={sourceTheme}>
        {({ tokens, getLineProps, getTokenProps, style }) => (
          <pre className="react-source-code" style={style} tabIndex={0} aria-label={title}>
            <code>
              {tokens.map((line, lineIndex) => (
                <div {...getLineProps({ line })} key={lineIndex}>
                  {line.map((token, tokenIndex) => (
                    <span {...getTokenProps({ token })} key={tokenIndex} />
                  ))}
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </details>
  );
}

function Example({ id, number, title, description, children, checks, source }) {
  return (
    <section className="react-example" id={id} aria-labelledby={`${id}-title`}>
      <div className="react-example-intro">
        <span className="react-example-number">{number}</span>
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="react-demo">{children}</div>
      <aside className="react-try" aria-label={`Things to try in ${title}`}>
        <h3>Try this</h3>
        <ul>
          {checks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      </aside>
      <Source title={`Source: ${title}`} source={source} />
    </section>
  );
}

function App() {
  return (
    <>
      <header className="topbar react-topbar">
        <a className="brand" href="../">
          <span className="brand-mark">🐽</span> gordito
        </a>
        <nav aria-label="React page">
          <a href="#examples">Examples</a>
          <a href="#usage">Usage notes</a>
          <a href="../">All demos ↗</a>
        </nav>
      </header>
      <main className="react-page" id="top">
        <section className="react-hero" aria-labelledby="react-title">
          <p className="kicker">Gordito for React</p>
          <h1 id="react-title">
            React slides.
            <br />
            <span>Infinite possibilities.</span>
          </h1>
          <p className="react-lede">
            Build infinite carousels with your own components and React state. Explore working
            examples, then use their markup and interaction patterns as a starting point for your
            own design.
          </p>
          <div className="react-hero-links">
            <a className="primary-cta" href="#examples">
              Try the examples <span aria-hidden="true">↓</span>
            </a>
            <a className="secondary-cta" href="#usage">
              How to use it <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="react-hint">
            Drag a card, use the buttons, or resize the window. Source code is included below each
            example.
          </p>
        </section>
        <div id="examples" className="react-example-list">
          <Example
            id="interactive"
            number="01"
            title="Interactive infinite slides"
            description="Just two source items, with React-rendered copies on either side. Saved counts live above the slides, so every copy stays in sync. The event readout also shows when a move starts and finishes."
            checks={[
              'Save a card, then loop forwards and backwards. Every version of that item should show the same count.',
              'Edit a caption and save that card again. The message should use the new caption, even on a copy.',
              'Try quick repeated navigation and the hook button. Watch the before/after event readout.',
            ]}
            source={interactiveSource}
          >
            <InteractiveGallery />
          </Example>
          <Example
            id="editable"
            number="02"
            title="Your data, your slide list"
            description="Add, remove, rename, and reorder items through React state. Stable keys identify the source cards. Update your data and let the carousel handle the rendered slides."
            checks={[
              'Rename a card and reverse the order. Its stable ID should travel with the title.',
              'Clear the list, then add a card or restore the defaults to start again.',
              'Add enough cards to navigate, then remove the last one while it is selected.',
            ]}
            source={editableSource}
          >
            <EditableGallery />
          </Example>
          <Example
            id="selectors"
            number="03"
            title="Filters, styles, and fresh starts"
            description="Choose which cards appear with a slide selector. Switch between infinite and finite navigation, and change the cards’ appearance through React props."
            checks={[
              'Turn off Featured only. A should return alongside B and C. Toggle it several times.',
              'Toggle Infinite + blue accent. All originals and copies should switch color together.',
              'In finite mode, arrows should stop at the edges. If all items fit, there is nowhere to move.',
            ]}
            source={selectableSource}
          >
            <SelectableGallery />
          </Example>
        </div>
        <section className="react-usage" id="usage" aria-labelledby="usage-title">
          <p className="kicker">Take it with you</p>
          <h2 id="usage-title">A few things to know</h2>
          <p>Install the package in your React app:</p>
          <pre className="react-install">
            <code>npm install @wethegit/gordito-carousel</code>
          </pre>
          <p>
            Use an example’s JSX to get started. Import the components from{' '}
            <code>@wethegit/gordito-carousel/react</code> and add your own styles. The examples’
            visual design is not included in the package.
          </p>
          <ul>
            <li>
              <strong>
                Use <code>items</code> for interactive infinite slides.
              </strong>{' '}
              React owns the rendered copies and their handlers. Without it, authored children use
              DOM cloning.
            </li>
            <li>
              <strong>Keep keys and options stable.</strong> Replace the items array when content
              changes. A new options object recreates core and returns to <code>initialSlide</code>.
            </li>
            <li>
              <strong>Copies are separate instances.</strong> Lift shared state above the slides, as
              the save-count example does. Effects and local state otherwise belong to each copy.
            </li>
            <li>
              <strong>Markup stays semantic.</strong> List tracks wrap non-list-item content in{' '}
              <code>li</code>. Put slide styles and selector classes on <code>CarouselItem</code>.
            </li>
            <li>
              <strong>You own the design.</strong> The React entry point includes structural CSS for
              carousel mechanics and animation suppression. Set slide widths, viewport clipping,
              spacing, and presentation in your own CSS. See the{' '}
              <a href="../#css-model">CSS model</a> and <a href="../#variables">CSS variables</a>{' '}
              for layout guidance.
            </li>
            <li>
              <strong>Use a client boundary when needed.</strong> The examples include{' '}
              <code>'use client'</code> for server-component frameworks.
            </li>
          </ul>
        </section>
      </main>
      <footer className="react-footer">
        <a className="brand" href="../">
          <span className="brand-mark">🐽</span> gordito
        </a>
        <a href="https://github.com/wethegit/gordito-carousel">View the project on GitHub ↗</a>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
