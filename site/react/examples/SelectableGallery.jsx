'use client';

import { useMemo, useState } from 'react';
import {
  Carousel,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '../../../src/react/index.tsx';

const sources = [
  { id: 'a', label: 'A', title: 'Everyday essentials', featured: false },
  { id: 'b', label: 'B', title: 'A fresh perspective', featured: true },
  { id: 'c', label: 'C', title: 'The next chapter', featured: true },
];

function SelectableStatus({ labels, infiniteBlue }) {
  const { currentSlide } = useCarousel();

  return (
    <p className="react-status" aria-live="polite">
      Slide {currentSlide + 1} of {labels.length} · Source {labels[currentSlide]} ·{' '}
      {infiniteBlue ? 'Infinite / blue' : 'Finite / pink'}
    </p>
  );
}

export function SelectableGallery() {
  const [featuredOnly, setFeaturedOnly] = useState(true);
  const [infiniteBlue, setInfiniteBlue] = useState(true);
  const options = useMemo(
    () => ({ infinite: infiniteBlue, slide: featuredOnly ? '.featured' : '' }),
    [featuredOnly, infiniteBlue],
  );
  // Keep all three sources stable when only the selector changes.
  const items = useMemo(
    () =>
      sources.map((source, index) => (
        <CarouselItem
          key={source.id}
          className={`react-card ${source.featured ? 'featured' : 'standard'}`}
          style={{
            color: infiniteBlue ? '#081c81' : '#7f0315',
            backgroundColor: infiniteBlue ? '#e8f0ff' : '#fff0f6',
          }}
        >
          <span className="react-card-tag">{source.featured ? 'Featured' : 'Standard'}</span>
          <span className="react-card-number">{source.label}</span>
          <h3>{source.title}</h3>
          <p className="react-card-description">
            Source {source.label} · position {index + 1} in the original collection.
          </p>
        </CarouselItem>
      )),
    [infiniteBlue],
  );
  const labels = sources
    .filter((source) => !featuredOnly || source.featured)
    .map((source) => source.label);

  return (
    <div>
      <div className="react-toolbar">
        <label>
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(event) => setFeaturedOnly(event.target.checked)}
          />
          Featured only
        </label>
        <label>
          <input
            type="checkbox"
            checked={infiniteBlue}
            onChange={(event) => setInfiniteBlue(event.target.checked)}
          />
          Infinite + blue accent
        </label>
      </div>
      <Carousel
        className="react-carousel"
        aria-label="Selectable featured cards"
        trackAs="ol"
        items={items}
        options={options}
      >
        <div className="react-controls">
          <CarouselPrevious>Previous</CarouselPrevious>
          <CarouselNext>Next</CarouselNext>
        </div>
        <SelectableStatus labels={labels} infiniteBlue={infiniteBlue} />
      </Carousel>
    </div>
  );
}

export default SelectableGallery;
