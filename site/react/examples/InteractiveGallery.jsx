'use client';

import { useMemo, useState } from 'react';
import {
  Carousel,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '../../../src/react/index.tsx';

const cards = [
  {
    id: 'rituals',
    title: 'Small rituals',
    caption: 'A little room to slow down.',
  },
  { id: 'ideas', title: 'Bright ideas', caption: 'Something worth keeping.' },
];
const options = { infinite: true };

function InteractiveControls({ total }) {
  const { carousel, currentSlide, swipe } = useCarousel();

  return (
    <>
      <div className="react-controls">
        <CarouselPrevious>Previous</CarouselPrevious>
        <CarouselNext>Next</CarouselNext>
        <button type="button" disabled={!carousel} onClick={() => swipe('next')}>
          Next through the hook
        </button>
      </div>
      <p className="react-status" aria-live="polite">
        Slide {currentSlide + 1} of {total}
      </p>
    </>
  );
}

export function InteractiveGallery() {
  const [captions, setCaptions] = useState(() =>
    Object.fromEntries(cards.map((card) => [card.id, card.caption])),
  );
  const [saves, setSaves] = useState({});
  const [lastSaved, setLastSaved] = useState('Nothing saved yet.');
  const [beforeChange, setBeforeChange] = useState('No before-change event yet.');
  const [afterChange, setAfterChange] = useState('No after-change event yet.');

  // Event-only updates must not rebuild items and refresh a carousel mid-transition.
  const items = useMemo(
    () =>
      cards.map((card, index) => (
        <CarouselItem key={card.id} className="react-card">
          <span className="react-card-tag">Shared state · source {index + 1}</span>
          <span className="react-card-number">0{index + 1}</span>
          <h3>{card.title}</h3>
          <p className="react-card-description">{captions[card.id]}</p>
          <div className="react-card-actions">
            <button
              type="button"
              onClick={() => {
                setSaves((previous) => ({
                  ...previous,
                  [card.id]: (previous[card.id] ?? 0) + 1,
                }));
                setLastSaved(`Saved ${card.title}: ${captions[card.id]}`);
              }}
            >
              Save {card.title} ({saves[card.id] ?? 0})
            </button>
          </div>
        </CarouselItem>
      )),
    [captions, saves],
  );

  return (
    <div>
      <div className="react-toolbar">
        {cards.map((card) => (
          <label key={card.id}>
            Caption for {card.title}
            <input
              type="text"
              value={captions[card.id]}
              onChange={(event) =>
                setCaptions((previous) => ({
                  ...previous,
                  [card.id]: event.target.value,
                }))
              }
            />
          </label>
        ))}
      </div>
      <Carousel
        className="react-carousel react-carousel--interactive"
        aria-label="Interactive saved cards"
        items={items}
        options={options}
        onBeforeChange={(current, next) =>
          setBeforeChange(`Before change: slide ${current + 1} → slide ${next + 1}.`)
        }
        onAfterChange={(current) => setAfterChange(`After change: slide ${current + 1}.`)}
      >
        <InteractiveControls total={cards.length} />
        <p className="react-status" aria-live="polite">
          {lastSaved}
        </p>
        <p className="react-status" aria-live="polite">
          {beforeChange} {afterChange}
        </p>
      </Carousel>
    </div>
  );
}

export default InteractiveGallery;
