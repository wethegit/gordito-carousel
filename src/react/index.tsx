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
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

export interface CarouselProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  onAfterChange?: (currentSlide: number, carousel: WtcGorditoCarousel) => void;
  options?: Partial<WtcGorditoCarouselOptions>;
}

export function Carousel({ children, onAfterChange, options, ...props }: CarouselProps) {
  const root = useRef<HTMLElement>(null);
  const callback = useRef(onAfterChange);
  const [carousel, setCarousel] = useState<WtcGorditoCarousel | null>(null);
  const [currentSlide, setCurrentSlide] = useState(options?.initialSlide ?? 0);

  callback.current = onAfterChange;

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const handleAfterChange = (event: Event) => {
      const instance = (event as CustomEvent<{ carousel: WtcGorditoCarousel }>).detail.carousel;
      setCurrentSlide(instance.currentSlide);
      callback.current?.(instance.currentSlide, instance);
    };

    element.addEventListener('wtcg:afterChange', handleAfterChange);
    const instance = new WtcGorditoCarousel(element, options);
    setCarousel(instance);
    setCurrentSlide(instance.currentSlide);

    return () => {
      element.removeEventListener('wtcg:afterChange', handleAfterChange);
      instance.destroy();
      setCarousel(null);
    };
  }, [options]);

  return (
    <CarouselContext.Provider value={{ carousel, currentSlide }}>
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
