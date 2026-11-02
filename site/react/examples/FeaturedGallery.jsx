'use client';

import {
  Carousel,
  CarouselItem,
  CarouselNext,
  CarouselPage,
  CarouselPagination,
  CarouselPrevious,
  useCarousel,
} from '../../../src/react/index.tsx';

const photos = [
  { id: 1015, title: 'Mountain lake', place: 'Dolomites', w: 1200, h: 760 },
  { id: 1025, title: 'Dog portrait', place: 'At home', w: 900, h: 570 },
  { id: 1036, title: 'Forest road', place: 'Oregon', w: 1500, h: 950 },
  { id: 1040, title: 'Sea cliff', place: 'Cornwall', w: 750, h: 475 },
  { id: 1043, title: 'Open field', place: 'Yorkshire', w: 1350, h: 855 },
  { id: 1050, title: 'Harbor', place: 'Copenhagen', w: 1050, h: 665 },
  { id: 1067, title: 'City scene', place: 'Architecture', w: 1200, h: 760 },
  { id: 1074, title: 'Lion', place: 'Wildlife', w: 900, h: 570 },
];
const options = {
  centerMode: true,
  pagination: true,
  drag: 'free',
  focusOnSelect: true,
  infinite: true,
  initialSlide: 1,
};
const items = photos.map((photo, index) => (
  <CarouselItem key={photo.id} aria-label={`${index + 1} of ${photos.length}`}>
    <figure className="photo-slide">
      <img
        src={`https://picsum.photos/id/${photo.id}/${photo.w}/${photo.h}`}
        width={photo.w}
        height={photo.h}
        alt={photo.title}
        loading="eager"
        draggable={false}
      />
      <figcaption>
        <strong>{photo.title}</strong>
        <em>{photo.place}</em>
      </figcaption>
    </figure>
  </CarouselItem>
));

function FeaturedStatus() {
  const { currentSlide } = useCarousel();

  return (
    <p className="react-status" aria-live="polite" aria-atomic="true">
      Photo {currentSlide + 1} of {photos.length} · {photos[currentSlide].title}
    </p>
  );
}

export function FeaturedGallery() {
  return (
    <div className="react-featured-bleed">
      <Carousel
        className="demo-stage fan react-featured-carousel"
        aria-label="Featured React photo carousel"
        aria-roledescription="carousel"
        items={items}
        options={options}
      >
        <CarouselPrevious className="stage-arrow prev" aria-label="Previous photo">
          <span aria-hidden="true">←</span>
        </CarouselPrevious>
        <CarouselNext className="stage-arrow next" aria-label="Next photo">
          <span aria-hidden="true">→</span>
        </CarouselNext>
        <div className="controls">
          <CarouselPagination aria-label="Choose a photo">
            {photos.map((photo, index) => (
              <li key={photo.id}>
                <CarouselPage aria-label={`Show ${photo.title}`}>
                  {String(index + 1).padStart(2, '0')}
                </CarouselPage>
              </li>
            ))}
          </CarouselPagination>
        </div>
        <FeaturedStatus />
      </Carousel>
    </div>
  );
}

export default FeaturedGallery;
