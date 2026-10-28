'use client';

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ElementType,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { WtcGorditoCarousel, type WtcGorditoCarouselOptions } from '../wtc-gordito-carousel.js';
import './style.css';

export interface CarouselContextValue {
  carousel: WtcGorditoCarousel | null;
  currentSlide: number;
  setPosition: () => void;
  swipe: (direction: 'next' | 'previous') => void;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

export interface CarouselProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  onBeforeChange?: (currentSlide: number, nextSlide: number, carousel: WtcGorditoCarousel) => void;
  onAfterChange?: (currentSlide: number, carousel: WtcGorditoCarousel) => void;
  options?: Partial<WtcGorditoCarouselOptions>;
}

export function Carousel({
  children,
  onBeforeChange,
  onAfterChange,
  options,
  ...props
}: CarouselProps) {
  const root = useRef<HTMLElement>(null);
  const beforeChangeCallback = useRef(onBeforeChange);
  const afterChangeCallback = useRef(onAfterChange);
  const [carousel, setCarousel] = useState<WtcGorditoCarousel | null>(null);
  const [currentSlide, setCurrentSlide] = useState(options?.initialSlide ?? 0);

  beforeChangeCallback.current = onBeforeChange;
  afterChangeCallback.current = onAfterChange;

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const handleBeforeChange = (event: Event) => {
      if (event.target !== element) return;

      const {
        carousel: instance,
        currentSlide: current,
        nextSlide,
      } = (
        event as CustomEvent<{
          carousel: WtcGorditoCarousel;
          currentSlide: number;
          nextSlide: number;
        }>
      ).detail;
      beforeChangeCallback.current?.(current, nextSlide, instance);
    };

    const handleAfterChange = (event: Event) => {
      if (event.target !== element) return;

      const instance = (event as CustomEvent<{ carousel: WtcGorditoCarousel }>).detail.carousel;
      setCurrentSlide(instance.currentSlide);
      afterChangeCallback.current?.(instance.currentSlide, instance);
    };

    const handleReInit = (event: Event) => {
      if (event.target !== element) return;

      const instance = (event as CustomEvent<{ carousel: WtcGorditoCarousel }>).detail.carousel;
      setCurrentSlide(instance.currentSlide);
    };

    element.addEventListener('wtcg:beforeChange', handleBeforeChange);
    element.addEventListener('wtcg:afterChange', handleAfterChange);
    element.addEventListener('wtcg:reInit', handleReInit);
    const instance = new WtcGorditoCarousel(element, options);
    setCarousel(instance);
    setCurrentSlide(instance.currentSlide);

    const observer = new MutationObserver(() => {
      const slides = instance.collectDirectSlides();
      const slidesChanged =
        slides.length !== instance.originalSlides.length ||
        slides.some((slide, index) => slide !== instance.originalSlides[index]);

      if (slidesChanged) instance.refresh();
    });
    observer.observe(instance.track, { childList: true });

    return () => {
      observer.disconnect();
      element.removeEventListener('wtcg:beforeChange', handleBeforeChange);
      element.removeEventListener('wtcg:afterChange', handleAfterChange);
      element.removeEventListener('wtcg:reInit', handleReInit);
      instance.destroy();
      setCarousel(null);
    };
  }, [options]);

  return (
    <CarouselContext.Provider
      value={{
        carousel,
        currentSlide,
        setPosition: () => carousel?.setPosition(),
        swipe: (direction) => {
          if (!carousel) return;
          carousel.slider.dispatchEvent(
            new CustomEvent('wtcg:swipe', {
              bubbles: true,
              detail: { carousel, direction },
            }),
          );
          if (direction === 'next') carousel.next();
          else carousel.prev();
        },
      }}
    >
      <section {...props} ref={root} data-wtcg-carousel="">
        {children}
      </section>
    </CarouselContext.Provider>
  );
}

type MarkerProps<T extends ElementType> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

export function CarouselList<T extends ElementType = 'div'>({
  as,
  ...props
}: MarkerProps<T>): ReactElement {
  const Element = as ?? 'div';
  return createElement(Element, { ...props, 'data-wtcg-list': '' } as ComponentPropsWithoutRef<T>);
}

export function CarouselTrack<T extends ElementType = 'div'>({
  as,
  ...props
}: MarkerProps<T>): ReactElement {
  const Element = as ?? 'div';
  return createElement(Element, { ...props, 'data-wtcg-track': '' } as ComponentPropsWithoutRef<T>);
}

export function CarouselSlide<T extends ElementType = 'div'>({
  as,
  ...props
}: MarkerProps<T>): ReactElement {
  const Element = as ?? 'div';
  return createElement(Element, { ...props, 'data-wtcg-slide': '' } as ComponentPropsWithoutRef<T>);
}

export function CarouselPagination({ ...props }: HTMLAttributes<HTMLOListElement>) {
  return <ol {...props} data-wtcg-pagination="" />;
}

export function CarouselPage({
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} {...props} data-wtcg-page="" />;
}

export function CarouselPrevious({
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} {...props} data-wtcg-prev="" />;
}

export function CarouselNext({
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} {...props} data-wtcg-next="" />;
}

export function useCarousel(): CarouselContextValue {
  const context = useContext(CarouselContext);
  if (!context) throw new Error('useCarousel must be used within a Carousel.');
  return context;
}
