'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Carousel,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '../../../src/react/index.tsx';

const defaults = [
  { id: '1', title: 'First light' },
  { id: '2', title: 'Open roads' },
  { id: '3', title: 'Going places' },
];
const options = { infinite: true };

function EditableStatus({ total }) {
  const { currentSlide } = useCarousel();

  return (
    <p className="react-status" aria-live="polite">
      {total === 0 ? 'No cards in the source.' : `Slide ${currentSlide + 1} of ${total}`}
    </p>
  );
}

export function EditableGallery() {
  const [cards, setCards] = useState(defaults);
  const nextId = useRef(4);
  const items = useMemo(
    () =>
      cards.map((card, index) => (
        <CarouselItem key={card.id} className="react-card">
          <span className="react-card-tag">Stable ID {card.id}</span>
          <span className="react-card-number">{String(index + 1).padStart(2, '0')}</span>
          <h3>{card.title}</h3>
          <p className="react-card-description">
            Source position {index + 1}. Edit the source title and every copy follows along.
          </p>
        </CarouselItem>
      )),
    [cards],
  );

  function addCard() {
    const id = String(nextId.current++);
    setCards((previous) => [...previous, { id, title: `New card ${id}` }]);
  }

  return (
    <div>
      <div className="react-toolbar">
        <button type="button" onClick={addCard}>
          Add a card
        </button>
        <button
          type="button"
          disabled={cards.length === 0}
          onClick={() => setCards((previous) => previous.slice(0, -1))}
        >
          Remove last
        </button>
        <button
          type="button"
          disabled={cards.length < 2}
          onClick={() => setCards((previous) => previous.toReversed())}
        >
          Reverse order
        </button>
        <button type="button" disabled={cards.length === 0} onClick={() => setCards([])}>
          Clear all
        </button>
        <button type="button" onClick={() => setCards(defaults)}>
          Restore defaults
        </button>
      </div>
      <div className="react-toolbar">
        {cards.map((card) => (
          <label key={card.id}>
            Title for card {card.id}
            <input
              type="text"
              value={card.title}
              onChange={(event) => {
                const title = event.target.value;
                setCards((previous) =>
                  previous.map((item) => (item.id === card.id ? { ...item, title } : item)),
                );
              }}
            />
          </label>
        ))}
      </div>
      <Carousel
        className="react-carousel"
        aria-label="Editable source cards"
        items={items}
        options={options}
      >
        {cards.length === 0 && (
          <p className="react-empty">
            Your source is empty. Add a card or restore the defaults above.
          </p>
        )}
        <div className="react-controls">
          <CarouselPrevious disabled={cards.length === 0}>Previous</CarouselPrevious>
          <CarouselNext disabled={cards.length === 0}>Next</CarouselNext>
        </div>
        <EditableStatus total={cards.length} />
      </Carousel>
    </div>
  );
}

export default EditableGallery;
