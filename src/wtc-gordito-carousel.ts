import { toArray, toElement, clamp, modulo, dispatch } from './wtc-gordito-carousel-utils.js';

export type WtcGorditoCarouselTarget = boolean | string | HTMLElement;
export type WtcGorditoCarouselDrag = boolean | 'fixed' | 'free';

export interface WtcGorditoCarouselOptions {
  adaptiveHeight?: boolean;
  arrows?: WtcGorditoCarouselTarget;
  centerMode?: boolean;
  pagination?: WtcGorditoCarouselTarget;
  drag?: WtcGorditoCarouselDrag;
  edgeFriction?: number;
  focusOnSelect?: boolean;
  focusOnChange?: boolean;
  infinite?: boolean;
  initialSlide?: number;
  slide?: string;
  touchThreshold?: number;
  waitForAnimate?: boolean;
}

export type WtcGorditoCarouselOptionValue = Exclude<
  WtcGorditoCarouselOptions[keyof WtcGorditoCarouselOptions],
  undefined
>;

type BoundHandlers = {
  next: (event?: Event) => void;
  prev: (event?: Event) => void;
  setPosition: () => void;
  handleResize: () => void;
  handlePointerDown: (event: PointerEvent) => void;
  handlePointerMove: (event: PointerEvent) => void;
  handlePointerUp: (event: PointerEvent) => void;
  handleMediaLoad: (event: Event) => void;
  handleClick: (event: MouseEvent) => void;
};

/**
 * Default options for {@link WtcGorditoCarousel}.
 *
 * These are exported so consumers can inspect defaults or compose their own option presets.
 * Most projects should only set the behavioral options they actually need. Visual
 * customization should happen with CSS variables rather than JavaScript options.
 *
 * @type {WtcGorditoCarouselOptions}
 */
export const WTC_GORDITO_CAROUSEL_DEFAULTS: Required<WtcGorditoCarouselOptions> = {
  adaptiveHeight: false,
  arrows: true,
  centerMode: false,
  pagination: false,
  drag: true,
  edgeFriction: 0.35,
  focusOnSelect: false,
  focusOnChange: false,
  infinite: true,
  initialSlide: 0,
  slide: '',
  touchThreshold: 5,
  waitForAnimate: false,
};

/**
 * Template tokens replaced inside `[data-wtcg-status]`.
 *
 * Exporting the literal tokens keeps author markup close to its final,
 * progressive HTML while avoiding copy/pasted magic strings in integrations.
 */
export const WTC_GORDITO_CAROUSEL_STATUS_TOKENS = {
  CURRENT: '{current}',
  TOTAL: '{total}',
};

/**
 * `WtcGorditoCarousel` expects an explicit `data-wtcg-*` DOM contract and mutates only
 * data attributes, ARIA/focus state, and inline layout styles.
 *
 * Events are emitted as bubbling `CustomEvent`s on the root element. Event names use
 * the `wtcg:` prefix: `wtcg:init`, `wtcg:beforeChange`, `wtcg:afterChange`,
 * `wtcg:reInit`, `wtcg:setPosition`, `wtcg:swipe`, and `wtcg:destroy`.
 *
 * Slides expose CSS custom properties that can be used for advanced styling:
 * `--wtcg-slide-index`, `--wtcg-slide-render-index`, `--wtcg-slide-offset`,
 * `--wtcg-slide-distance`, and `--wtcg-slide-side`. For example, style
 * previous/next slides based on distance and side from the selected slide with
 * a CSS-only transform or opacity rule.
 *
 * @example
 * const carousel = new WtcGorditoCarousel(document.querySelector('[data-gallery]'), {
 *   pagination: true,
 *   infinite: true
 * });
 *
 * @example
 * // Responsive behavior is CSS-first. The ResizeObserver in WtcGorditoCarousel will
 * // recalculate layout as container-query/custom-property values change.
 * .my-gallery {
 *   --wtcg-slides: 1;
 *   --wtcg-scroll: 1;
 *   container-type: inline-size;
 * }
 * @container (min-width: 42rem) {
 *   .my-gallery { --wtcg-slides: 2; }
 * }
 */
export class WtcGorditoCarousel {
  declare slider: HTMLElement;
  declare defaults: Required<WtcGorditoCarouselOptions>;
  declare originalSettings: Required<WtcGorditoCarouselOptions>;
  declare options: Required<WtcGorditoCarouselOptions>;
  declare enabled: boolean;
  declare animating: boolean;
  declare moveId: number;
  declare rebasing: boolean;
  declare dragging: boolean;
  declare currentSlide: number;
  declare trackIndex: number;
  declare slideCount: number;
  declare slideSize: number;
  declare slideSizes: number[];
  declare listSize: number;
  declare listContentSize: number;
  declare trackGap: number;
  declare _cloneCount: number;
  declare positionOffset: number | null;
  declare previewTrackIndex: number | null;
  declare previewPosition: number | null;
  declare renderedSlides: number;
  declare renderedScroll: number;
  declare windowTimer: number | null;
  declare resizeObserver: ResizeObserver | null;
  declare pointer: {
    id: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startOffset: number;
    currentOffset: number;
    moved: boolean;
    interrupted: boolean;
  } | null;
  declare pointerDownSlide: HTMLElement | null;
  declare pointerDownSlideTimer: number | null;
  declare shouldSuppressClick: boolean;
  declare eventController: AbortController | null;
  declare bound: BoundHandlers;
  declare originalSlides: HTMLElement[];
  declare filteredSlides: HTMLElement[] | null;
  declare list: HTMLElement;
  declare track: HTMLElement;
  declare prevArrow: HTMLButtonElement | null;
  declare nextArrow: HTMLButtonElement | null;
  declare pagination: HTMLElement | null;
  declare status: HTMLElement | null;
  declare statusTemplate: string;

  /**
   * Creates and initializes a carousel.
   *
   * The constructor reads JSON from `data-wtcg` on the element and merges it after
   * programmatic settings, so markup can override JavaScript defaults when needed.
   *
   * @param {string|HTMLElement} element - Carousel root element or a selector for it.
   * @param {Partial<WtcGorditoCarouselOptions>} [settings={}] - Option overrides.
   * @throws {Error} When `element` cannot be resolved to an element.
   */
  constructor(element: string | HTMLElement, settings: Partial<WtcGorditoCarouselOptions> = {}) {
    this.slider = (
      typeof element === 'string' ? document.querySelector<HTMLElement>(element) : element
    ) as HTMLElement;
    if (!this.slider) throw new Error('WtcGorditoCarousel requires a valid element.');

    const dataSettings = this.readDataSettings();
    this.defaults = WTC_GORDITO_CAROUSEL_DEFAULTS;
    this.originalSettings = { ...this.defaults, ...settings, ...dataSettings };
    this.options = { ...this.originalSettings };
    this.enabled = true;
    this.animating = false;
    this.moveId = 0;
    this.rebasing = false;
    this.dragging = false;
    this.currentSlide = this.options.initialSlide || 0;
    this.trackIndex = 0;
    this.slideCount = 0;
    this.slideSize = 0;
    this.slideSizes = [];
    this.listSize = 0;
    this.listContentSize = 0;
    this.trackGap = 0;
    this._cloneCount = 0;
    this.positionOffset = null;
    this.previewTrackIndex = null;
    this.previewPosition = null;
    this.renderedSlides = 1;
    this.renderedScroll = 1;
    this.windowTimer = null;
    this.resizeObserver = null;
    this.pointer = null;
    this.pointerDownSlide = null;
    this.pointerDownSlideTimer = null;
    this.shouldSuppressClick = false;
    this.eventController = null;
    this.bound = {} as BoundHandlers;
    this.originalSlides = [];
    this.filteredSlides = null;
    this.pagination = null;
    this.status = null;
    this.statusTemplate = '';

    this.bindMethods();
    this.init(true);
  }

  /** @private Binds event handlers once so they can be reused and aborted cleanly. */
  bindMethods(): void {
    (
      [
        'next',
        'prev',
        'setPosition',
        'handleResize',
        'handlePointerDown',
        'handlePointerMove',
        'handlePointerUp',
        'handleMediaLoad',
        'handleClick',
      ] as const
    ).forEach((name) => {
      (this.bound as unknown as Record<keyof BoundHandlers, (...args: never[]) => unknown>)[name] =
        (this[name] as unknown as (...args: never[]) => unknown).bind(this);
    });
  }

  /**
   * Reads JSON option overrides from `data-wtcg`.
   *
   * @private
   * @returns {Partial<WtcGorditoCarouselOptions>}
   */
  readDataSettings(): Partial<WtcGorditoCarouselOptions> {
    const raw = this.slider.getAttribute('data-wtcg');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  /**
   * Initializes DOM structure, controls, events, and sizing observers.
   *
   * @private
   * @param {boolean} [creation=false] - Whether this is the first initialization.
   */
  init(creation = false): void {
    if (this.slider.hasAttribute('data-wtcg-initialized')) return;

    this.enabled = true;

    this.slider.setAttribute('data-wtcg-initialized', '');
    this.slider.toggleAttribute('data-wtcg-center', this.options.centerMode);
    this.buildOut();
    this.buildArrows();
    this.buildPagination();
    this.buildStatus();
    this.initializeEvents();
    this.setPosition();
    this.updateUI(false);

    if (creation) dispatch(this.slider, 'init', { carousel: this });
  }

  /**
   * Finds track children that should be treated as original slides.
   *
   * @private
   * @returns {HTMLElement[]}
   */
  collectDirectSlides(): HTMLElement[] {
    if (!this.track) return [];

    return toArray<HTMLElement>(this.track.children as HTMLCollectionOf<HTMLElement>).filter(
      (child) => {
        if (!child.hasAttribute('data-wtcg-slide')) return false;
        if (child.hasAttribute('data-wtcg-cloned')) return false;

        return this.options.slide ? child.matches(this.options.slide) : true;
      },
    );
  }

  /** @private Reads required structure, marks slides, and renders infinite clones. */
  buildOut(): void {
    this.list = this.slider.querySelector<HTMLElement>(':scope > [data-wtcg-list]')!;
    if (!this.list) throw new Error('WtcGorditoCarousel requires a [data-wtcg-list] child.');

    this.track = this.list.querySelector<HTMLElement>(':scope > [data-wtcg-track]')!;
    if (!this.track) throw new Error('WtcGorditoCarousel requires a [data-wtcg-track] child.');

    this.slider.toggleAttribute('data-wtcg-draggable', this.isDraggable);

    const directSlides = this.collectDirectSlides();
    this.originalSlides = this.filteredSlides || directSlides;

    directSlides.forEach((slide) => {
      const filteredOut = !this.originalSlides.includes(slide);
      slide.hidden = filteredOut;
      if (filteredOut) slide.setAttribute('data-wtcg-filtered', 'true');
      else slide.removeAttribute('data-wtcg-filtered');
    });

    this.slideCount = this.originalSlides.length;

    this.currentSlide = this.slideCount ? clamp(this.currentSlide, 0, this.slideCount - 1) : 0;

    this.originalSlides.forEach((slide, index) => {
      slide.setAttribute('data-wtcg-index', String(index));

      if (!slide.hasAttribute('data-wtcg-original-style')) {
        slide.setAttribute('data-wtcg-original-style', slide.getAttribute('style') || '');
      }
    });

    this.renderedSlides = this.slides;
    if (!this.options.infinite) {
      this.currentSlide = clamp(this.currentSlide, 0, this.maxSlide);
    }

    this.renderedScroll = this.scrollAmount;
    this._cloneCount = this.calculateCloneCount();

    const preClones: HTMLElement[] = [];
    const postClones: HTMLElement[] = [];
    if (this.shouldClone) {
      // Infinite mode uses a bounded clone set instead of moving author-owned
      // slides or appending forever. That keeps DOM size stable and preserves
      // original child order, which matters for framework wrappers like React
      // where the renderer owns child reconciliation.
      for (let i = -this.cloneCount; i < 0; i += 1) {
        const index = modulo(i, this.slideCount);
        const clone = this.originalSlides[index]!.cloneNode(true) as HTMLElement;

        clone.setAttribute('data-wtcg-cloned', '');
        clone.setAttribute('data-wtcg-index', String(i));

        preClones.push(clone);
      }
      for (let i = this.slideCount; i < this.slideCount + this.cloneCount; i += 1) {
        const index = modulo(i, this.slideCount);
        const clone = this.originalSlides[index]!.cloneNode(true) as HTMLElement;

        clone.setAttribute('data-wtcg-cloned', '');
        clone.setAttribute('data-wtcg-index', String(i));

        postClones.push(clone);
      }
    }

    preClones.forEach((slide) => this.track.appendChild(slide));
    this.originalSlides.forEach((slide) => this.track.appendChild(slide));

    postClones.forEach((slide) => this.track.appendChild(slide));
    this.trackIndex = this.cloneCount + this.currentSlide;
  }

  /** @private Finds existing previous/next buttons when arrow navigation is enabled. */
  buildArrows(): void {
    if (!this.options.arrows) return;

    const arrowTarget = (toElement(this.options.arrows, this.slider) || this.slider) as {
      querySelector?: (selectors: string) => Element | null;
    };

    this.prevArrow = (arrowTarget.querySelector?.('[data-wtcg-prev]') ||
      null) as HTMLButtonElement | null;
    this.nextArrow = (arrowTarget.querySelector?.('[data-wtcg-next]') ||
      null) as HTMLButtonElement | null;
  }

  /** @private Finds and prepares existing pagination buttons. */
  buildPagination(): void {
    if (!this.options.pagination) return;

    const paginationTarget = (toElement(this.options.pagination, this.slider) || this.slider) as {
      querySelector?: (selectors: string) => Element | null;
    };

    this.pagination = (paginationTarget.querySelector?.('[data-wtcg-pagination]') ||
      null) as HTMLElement | null;
    if (!this.pagination) return;

    this.pagination.hidden = !this.canNavigate;
    if (!this.canNavigate) return;

    const paginationIndexes = this.paginationIndexes;
    const controls = toArray<HTMLElement>(
      this.pagination.querySelectorAll<HTMLElement>('[data-wtcg-page]'),
    );
    controls.forEach((control, paginationIndex) => {
      const slideIndex = paginationIndexes[paginationIndex];
      const item = control.parentElement as HTMLElement | null;

      // Pagination is author-owned markup, including static semantics. The core only
      // adds runtime behavior/state and hides extras so framework render trees
      // stay stable.
      if (item) {
        item.hidden = slideIndex === undefined;
        item.removeAttribute('data-wtcg-active');
      }

      control.hidden = slideIndex === undefined;

      if (slideIndex === undefined) return;

      control.removeAttribute('data-wtcg-active');

      if (control instanceof HTMLButtonElement) control.type = 'button';

      control.setAttribute('data-wtcg-index', String(slideIndex));
    });

    if (controls.length) this.slider.setAttribute('data-wtcg-paginated', '');
  }

  /** @private Finds the optional localized live-status template. */
  buildStatus(): void {
    this.status = this.slider.querySelector<HTMLElement>('[data-wtcg-status]');
    if (!this.status) return;

    // The author owns localization. We store the original markup once and only
    // replace exported placeholder tokens, so translated text/markup survives.
    // Live-region semantics are also author markup: progressive HTML should be
    // close to final before JavaScript attaches behavior.
    this.statusTemplate = this.status.innerHTML;
    this.updateStatus();
  }

  /** @private Attaches DOM, pointer, resize, visibility, and media events. */
  initializeEvents(): void {
    this.eventController = new AbortController();

    const { signal } = this.eventController;

    if (this.prevArrow) this.prevArrow.addEventListener('click', this.bound.prev, { signal });

    if (this.nextArrow) this.nextArrow.addEventListener('click', this.bound.next, { signal });

    if (this.pagination) {
      this.pagination.addEventListener(
        'click',
        (event: MouseEvent) => {
          const control = (event.target as Element).closest(
            '[data-wtcg-index]',
          ) as HTMLElement | null;
          if (!control) return;

          this.goTo(Number(control.getAttribute('data-wtcg-index')));

          control.focus();
        },
        { signal },
      );
    }
    if (this.isDraggable) {
      this.list.addEventListener('pointerdown', this.bound.handlePointerDown, {
        signal,
      });
      this.list.addEventListener('pointermove', this.bound.handlePointerMove, {
        signal,
      });
      this.list.addEventListener('pointerup', this.bound.handlePointerUp, {
        signal,
      });
      this.list.addEventListener('pointercancel', this.bound.handlePointerUp, {
        signal,
      });
      this.list.addEventListener('lostpointercapture', this.bound.handlePointerUp, { signal });
    }

    if (this.isDraggable || this.options.focusOnSelect) {
      this.list.addEventListener('click', this.bound.handleClick, {
        capture: true,
        signal,
      });
    }

    this.slider.addEventListener('load', this.bound.handleMediaLoad, {
      capture: true,
      signal,
    });
    this.slider.addEventListener('error', this.bound.handleMediaLoad, {
      capture: true,
      signal,
    });
    this.slider.addEventListener('loadedmetadata', this.bound.handleMediaLoad, {
      capture: true,
      signal,
    });

    // ResizeObserver catches local/container layout changes that can alter
    // measured slide/list geometry without a viewport resize, such as parent
    // grid/flex changes, accordions, sidebars, or container-query layouts.
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.bound.handleResize);
      this.resizeObserver.observe(this.slider);
    }

    // Keep window resize too. Viewport media queries can change CSS variables
    // such as --wtcg-slides, --wtcg-scroll, gaps, or slide sizing, and those
    // computed-value changes are not guaranteed to trigger ResizeObserver.
    window.addEventListener('resize', this.bound.handleResize, { signal });
    window.addEventListener('orientationchange', this.bound.handleResize, {
      signal,
    });
  }

  /**
   * Destroys the carousel and restores original slides to the root element.
   *
   * @param {boolean} [refresh=false] - Internal flag used when destruction is part of a refresh/reinitialization cycle.
   * @fires wtcg:destroy
   */
  destroy(refresh = false): void {
    // Restore the original DOM shape so external renderers keep ownership of
    // author-provided slides, controls, and semantics.
    // Will make using with React easier
    if (this.eventController) this.eventController.abort();
    if (this.resizeObserver) this.resizeObserver.disconnect();
    window.clearTimeout(this.pointerDownSlideTimer as number | undefined);

    this.originalSlides.forEach((slide) => {
      slide.removeAttribute('data-wtcg-active');
      slide.removeAttribute('data-wtcg-current');
      slide.removeAttribute('data-wtcg-center');
      slide.removeAttribute('aria-hidden');

      slide.inert = false;

      const originalStyle = slide.getAttribute('data-wtcg-original-style');
      if (originalStyle !== null) slide.setAttribute('style', originalStyle);

      slide.removeAttribute('data-wtcg-original-style');
    });

    if (this.list) {
      this.list.style.height = '';
    }

    if (this.track) {
      this.track.style.transform = '';
      this.track.style.width = '';

      this.track.querySelectorAll('[data-wtcg-cloned]').forEach((slide) => slide.remove());
    }

    if (this.prevArrow) {
      this.prevArrow.disabled = false;
      this.prevArrow.hidden = false;

      this.prevArrow.removeAttribute('aria-disabled');
    }

    if (this.nextArrow) {
      this.nextArrow.disabled = false;
      this.nextArrow.hidden = false;

      this.nextArrow.removeAttribute('aria-disabled');
    }

    if (this.pagination) {
      this.pagination.hidden = false;
      this.pagination.querySelectorAll<HTMLElement>('[data-wtcg-page]').forEach((button) => {
        button.removeAttribute('data-wtcg-active');
        button.hidden = false;
        button.removeAttribute('aria-current');
        button.removeAttribute('data-wtcg-index');

        if (button.parentElement) {
          button.parentElement.removeAttribute('data-wtcg-active');
          button.parentElement.hidden = false;
        }
      });
    }

    if (this.status) this.status.innerHTML = this.statusTemplate;

    this.slider.removeAttribute('data-wtcg-initialized');
    this.slider.removeAttribute('data-wtcg-paginated');
    this.slider.removeAttribute('data-wtcg-center');
    this.slider.removeAttribute('data-wtcg-instant');
    this.slider.removeAttribute('data-wtcg-draggable');
    this.slider.removeAttribute('data-wtcg-dragging');

    this.prevArrow = null;
    this.nextArrow = null;
    this.pagination = null;
    this.status = null;
    this.statusTemplate = '';
    this.pointerDownSlide = null;
    this.pointerDownSlideTimer = null;
    this.clearDragPreview();
    this.enabled = false;

    dispatch(this.slider, 'destroy', { carousel: this, refresh });
  }

  /**
   * Rebuilds the carousel from current DOM children and current options.
   *
   * Use this after external code changes slide dimensions or markup in a way the
   * carousel cannot observe automatically.
   *
   * @param {boolean} [initializing=false] - Emits `wtcg:init` instead of `wtcg:reInit` when true.
   * @fires wtcg:init
   * @fires wtcg:reInit
   */
  refresh(initializing = false): void {
    const previous = this.currentSlide;

    this.destroy(true);

    this.currentSlide = clamp(previous, 0, Math.max(0, this.collectDirectSlides().length - 1));

    this.slider.removeAttribute('data-wtcg-initialized');

    this.init(false);

    dispatch(this.slider, initializing ? 'init' : 'reInit', { carousel: this });
  }

  /** @private @returns {number} Visible slide count from CSS custom properties. */
  get slides(): number {
    const fallback = 1;
    if (!this.list) return fallback;

    const raw = window.getComputedStyle(this.list).getPropertyValue('--wtcg-slides').trim();
    const value = Number(raw);

    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  /** @private @returns {number} Scroll amount from CSS custom properties. */
  get scrollAmount(): number {
    const raw = window.getComputedStyle(this.list).getPropertyValue('--wtcg-scroll').trim();

    if (!raw || raw === 'auto') return Math.ceil(this.slides);

    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : Math.ceil(this.slides);
  }

  /**
   * Highest original slide index that can become the current slide.
   *
   * Non-infinite carousels normally stop at the last left-aligned window of
   * visible slides. Center mode keeps the current slide centered instead, so
   * every slide is a valid current slide and the window math does not apply.
   *
   * @private
   * @returns {number}
   */
  get maxSlide(): number {
    if (!this.slideCount) return 0;
    if (this.options.infinite || this.options.centerMode) return this.slideCount - 1;

    return Math.max(0, this.slideCount - Math.ceil(this.slides));
  }

  /**
   * Whether the carousel has anywhere to navigate to at all.
   *
   * Controls (arrows/pagination) hide when this is false. Center mode can move to
   * every slide, so it only needs more than one slide rather than more slides
   * than fit in the visible window.
   *
   * @private
   * @returns {boolean}
   */
  get canNavigate(): boolean {
    if (this.options.centerMode) return this.slideCount > 1;

    return this.slideCount > this.slides;
  }

  /**
   * Calculates how many clones are needed on each side for infinite movement.
   *
   * @private
   * @returns {number}
   */
  calculateCloneCount(): number {
    if (!this.options.infinite || this.slideCount <= 1) return 0;

    /*
     * Clone count is based on how much rendered content must exist around the
     * active range, not just one logical slide set.
     *
     * Instead of cloning one full set per side we clone a bounded multiple of full
     * sets:
     *
     * Examples:
     * - slideCount = 8, slides = 3, scroll = 3
     *   minimum 14, cloneCount 16, two full sets per side
     * - slideCount = 3, slides = 2, scroll = 2
     *   minimum 7, cloneCount 9, three full sets per side
     * - slideCount = 3, slides = 3, scroll = 3
     *   minimum 9, cloneCount 9, three full sets per side
     *
     * This preserves the full-set clone invariant:
     * - repeated order stays consistent
     * - React portability stays better because original children are untouched
     * - clone DOM growth is bounded and predictable
     */
    const visible = Math.ceil(this.slides);
    const scroll = Math.ceil(this.scrollAmount);
    const minimum = this.slideCount + visible + scroll;

    return Math.ceil(minimum / this.slideCount) * this.slideCount;
  }

  /** @private @returns {number} Clone count used by the currently rendered DOM. */
  get cloneCount(): number {
    return this._cloneCount;
  }

  /** @private @returns {boolean} Whether infinite clones should be rendered. */
  get shouldClone(): boolean {
    return this.cloneCount > 0 && this.slideCount > 0;
  }

  /** @private @returns {boolean} Whether pointer dragging is enabled. */
  get isDraggable(): boolean {
    return (
      this.options.drag === true || this.options.drag === 'fixed' || this.options.drag === 'free'
    );
  }

  /** @private @returns {"fixed"|"free"} Active pointer drag target mode. */
  get dragMode(): 'fixed' | 'free' {
    return this.options.drag === 'free' ? 'free' : 'fixed';
  }

  /**
   * Recalculates dimensions, ARIA/classes, and track position.
   *
   * This is safe to call after media loads, the container changes size, or host CSS
   * changes slide dimensions.
   *
   * @fires wtcg:setPosition
   */
  setPosition(): void {
    if (!this.enabled || !this.list || !this.track) return;

    this.setDimensions();
    this.updateUI(true);
    this.runInstantPosition();

    if (this.options.adaptiveHeight) this.setAdaptiveHeight();

    dispatch(this.slider, 'setPosition', { carousel: this });
  }

  /** @private Measures the layout authored by CSS. */
  setDimensions(): void {
    // The list box is the viewport we position against. Padding is authored CSS
    // (`--wtcg-center-padding` by default), so measure the rendered content area
    // instead of assuming the border-box width is the usable carousel width.
    const rect = this.list.getBoundingClientRect();
    this.listSize = rect.width;

    const style = window.getComputedStyle(this.list);
    const paddingStart = parseFloat(style.paddingInlineStart || style.paddingLeft) || 0;
    const paddingEnd = parseFloat(style.paddingInlineEnd || style.paddingRight) || 0;

    this.listContentSize = Math.max(0, this.listSize - paddingStart - paddingEnd);

    // Slide widths and gaps are also CSS-owned. Core only measures the resulting
    // DOM layout so container queries, media queries, and custom slide sizing all
    // feed into the same positioning math.
    const slides = this.allSlides;
    const trackStyle = window.getComputedStyle(this.track);

    this.trackGap = parseFloat(trackStyle.columnGap || trackStyle.gap) || 0;
    this.track.style.width = '';

    // offsetWidth intentionally ignores CSS transforms. Demos and consumers can
    // scale/rotate slides without feeding those visual effects back into layout.
    // The fallback prevents collapsed-layout failures before CSS/media resolve.
    const fallbackSlideSize = this.listContentSize / Math.max(1, this.slides);
    this.slideSizes = slides.map((slide) => slide.offsetWidth || fallbackSlideSize);
    this.slideSize = this.slideSizes[this.trackIndex] || fallbackSlideSize;

    const trackWidth =
      this.slideSizes.reduce((sum, size) => sum + size, 0) +
      this.trackGap * Math.max(0, slides.length - 1);

    // CSS starts the track as max-content; writing the measured width keeps
    // transform offsets stable across clone refreshes.
    this.track.style.width = `${trackWidth}px`;
  }

  /**
   * Returns original slides plus rendered clones.
   *
   * @private
   * @returns {HTMLElement[]}
   */
  get allSlides(): HTMLElement[] {
    return this.track
      ? toArray<HTMLElement>(this.track.children as HTMLCollectionOf<HTMLElement>).filter(
          (child) =>
            child.hasAttribute('data-wtcg-slide') && !child.hasAttribute('data-wtcg-filtered'),
        )
      : [];
  }

  /**
   * Returns an original slide by index, wrapping safely for infinite calculations.
   *
   * @private
   * @param {number} index
   * @returns {HTMLElement|undefined}
   */
  getOriginalSlideByIndex(index: number): HTMLElement | undefined {
    return this.originalSlides[modulo(index, this.slideCount)];
  }

  /**
   * Calculates the horizontal pixel offset for a rendered track index.
   *
   * @private
   * @param {number} [trackIndex=this.trackIndex]
   * @returns {number}
   */
  getTrackOffsetByIndex(trackIndex: number = this.trackIndex): number {
    const boundedIndex = clamp(trackIndex, 0, Math.max(0, this.slideSizes.length - 1));

    let offset = this.slideSizes.slice(0, boundedIndex).reduce((sum, size) => sum + size, 0);
    offset += this.trackGap * boundedIndex;

    const activeSize = this.slideSizes[boundedIndex] || this.slideSize;
    if (this.options.centerMode) offset -= (this.listContentSize - activeSize) / 2;

    return -offset;
  }

  /** @private @returns {number} Current rendered track offset. */
  get trackOffset(): number {
    return this.getTrackOffsetByIndex();
  }

  /** @private @returns {number} Rendered slide index nearest to a track offset. */
  getTrackIndexForOffset(offset: number): number {
    let closestIndex = this.trackIndex;
    let closestDistance = Infinity;

    this.slideSizes.forEach((_, index) => {
      const distance = Math.abs(this.getTrackOffsetByIndex(index) - offset);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  /** @private @returns {number} Fractional rendered slide position nearest to a track offset. */
  getTrackPositionForOffset(offset: number): number {
    const lastIndex = Math.max(0, this.slideSizes.length - 1);
    if (!lastIndex) return 0;

    const offsets = this.slideSizes.map((_, index) => this.getTrackOffsetByIndex(index));

    for (let index = 0; index < lastIndex; index += 1) {
      const start = offsets[index]!;
      const end = offsets[index + 1]!;
      const min = Math.min(start, end);
      const max = Math.max(start, end);

      if (offset < min || offset > max) continue;

      const distance = end - start;
      return distance ? index + (offset - start) / distance : index;
    }

    const first = offsets[0]!;
    const second = offsets[1]!;
    const beforeStart = Math.abs(offset - first) <= Math.abs(offset - offsets[lastIndex]!);
    if (beforeStart) {
      const distance = second - first;
      return distance ? (offset - first) / distance : 0;
    }

    const previous = offsets[lastIndex - 1]!;
    const last = offsets[lastIndex]!;
    const distance = last - previous;
    return distance ? lastIndex + (offset - last) / distance : lastIndex;
  }

  /** @private @returns {number} Rendered slide index used for visual slide state. */
  get stateTrackIndex(): number {
    return this.previewTrackIndex ?? this.trackIndex;
  }

  /** @private @returns {number} Fractional rendered slide position used for CSS variables. */
  get statePosition(): number {
    return this.previewPosition ?? this.stateTrackIndex;
  }

  /** @private Updates visual slide state while pointer dragging. */
  updateDragPreview(offset: number): void {
    if (!this.slideCount) return;

    const maxTrackIndex = this.options.infinite
      ? Math.max(0, this.slideSizes.length - 1)
      : this.maxSlide;

    this.previewTrackIndex = clamp(this.getTrackIndexForOffset(offset), 0, maxTrackIndex);
    this.previewPosition = clamp(this.getTrackPositionForOffset(offset), 0, maxTrackIndex);
    this.updateSlideClasses();
  }

  /** @private Clears transient drag state after the pointer gesture ends. */
  clearDragPreview(): void {
    this.previewTrackIndex = null;
    this.previewPosition = null;
  }

  /**
   * Writes track movement. Movement lifecycle state, including
   * `[data-wtcg-instant]` on the carousel root, is owned by `runPositionChange()`
   * and drag handling.
   *
   * @private
   * @param {number|null} [forcedOffset=null] - Optional drag offset instead of calculated slide offset.
   */
  applyPosition(forcedOffset: number | null = null): number {
    if (!this.track) return 0;

    const offset = forcedOffset === null ? this.trackOffset : forcedOffset;

    this.track.style.transform = `translate3d(${offset}px, 0, 0)`;

    this.positionOffset = offset;
    return offset;
  }

  /** @private @returns {number} Track offset as currently rendered, including mid-transition. */
  getRenderedOffset(): number {
    if (!this.track) return 0;

    const { transform } = window.getComputedStyle(this.track);
    return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
  }

  /** @private @returns {boolean} Whether current CSS can emit a transform transition event. */
  hasTransformTransition(): boolean {
    // We only use computed styles to detect the no-transition case. Timing still
    // comes from native transitionend/transitioncancel events.
    // I swear I tried with just using a `transitionrun` event listener but had too many issues
    if (!this.track) return false;

    const style = window.getComputedStyle(this.track);
    const properties = style.transitionProperty
      .split(',')
      .map((property) => property.trim().toLowerCase());
    const durations = style.transitionDuration.split(',').map((duration) => parseFloat(duration));

    return properties.some((property, index) => {
      if (property !== 'all' && property !== 'transform') return false;

      const duration = durations[index % durations.length] || 0;
      return duration > 0;
    });
  }

  /** @private Writes a non-animated position and restores transitions after paint. */
  runInstantPosition(callback: () => void = () => {}, forcedOffset: number | null = null): void {
    if (!this.track) {
      callback();
      return;
    }

    this.slider.setAttribute('data-wtcg-instant', '');
    this.applyPosition(forcedOffset);

    // Removing [data-wtcg-instant] synchronously can let the browser coalesce
    // the attribute removal with the transform write, causing an intended snap
    // to animate. Waiting two frames gives the browser one paint with
    // transitions disabled before normal transitions are restored.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        this.slider.removeAttribute('data-wtcg-instant');
        callback();
      });
    });
  }

  /** @private Applies movement and runs a callback after native transform transition completion, if any. */
  runPositionChange(instant: boolean, callback: () => void = () => {}): void {
    if (!this.track) {
      callback();
      return;
    }

    if (instant) {
      this.runInstantPosition(callback);
      return;
    }

    const track = this.track;
    const targetOffset = this.trackOffset;
    if (this.positionOffset === targetOffset) {
      this.slider.removeAttribute('data-wtcg-instant');
      this.applyPosition(targetOffset);
      callback();

      return;
    }

    let completed = false;

    const isTransformEvent = (event: TransitionEvent) =>
      event.target === track && event.propertyName === 'transform';

    const cleanup = () => {
      track.removeEventListener('transitionend', handleDone);
      track.removeEventListener('transitioncancel', handleDone);
    };

    const done = () => {
      if (completed) return;
      completed = true;
      cleanup();
      callback();
    };

    const handleDone = (event: TransitionEvent) => {
      if (!isTransformEvent(event)) return;

      // Retargeting cancels the previous transition, and that event can arrive
      // after this move's listeners are attached. Only a cancel that leaves the
      // track at this move's target (e.g. transitions switched off) finishes it.
      if (
        event.type === 'transitioncancel' &&
        Math.abs(this.getRenderedOffset() - targetOffset) > 0.5
      ) {
        return;
      }

      done();
    };

    // Note: we do want to remove this in case it was added by a cancelled
    // pointer down, and we want it before we coalesce the final position
    // so we don't get an snap of during normalization
    this.slider.removeAttribute('data-wtcg-instant');

    // Let transition-enabled styles apply before writing the transform. This
    // avoids coalescing instant-state removal with the movement that should
    // animate, especially at clone boundaries.
    window.requestAnimationFrame(() => {
      if (!this.hasTransformTransition()) {
        this.applyPosition(targetOffset);
        callback();

        return;
      }

      track.addEventListener('transitionend', handleDone);
      track.addEventListener('transitioncancel', handleDone);
      this.applyPosition(targetOffset);
    });
  }

  /**
   * Updates slide classes and controls.
   *
   * @private
   * @param {boolean} [updatePagination=true]
   */
  updateUI(updatePagination = true): void {
    this.updateSlideClasses();
    this.updateArrows();

    if (updatePagination) this.updatePagination();
    this.updateStatus();
  }

  /**
   * @private Updates state attributes, ARIA state, inert state, and slide CSS custom properties.
   */
  updateSlideClasses(): void {
    const allSlides = this.allSlides;
    const stateTrackIndex = this.stateTrackIndex;
    const statePosition = this.statePosition;

    allSlides.forEach((slide, renderIndex) => {
      const originalIndex = modulo(Number(slide.getAttribute('data-wtcg-index')), this.slideCount);
      const offset = renderIndex - statePosition;
      const distance = Math.abs(offset);
      const side = Math.sign(offset);

      slide.removeAttribute('data-wtcg-active');
      slide.removeAttribute('data-wtcg-current');
      slide.removeAttribute('data-wtcg-center');
      slide.setAttribute('aria-hidden', 'true');

      slide.inert = true;

      // These variables are the styling surface for advanced layouts. They keep
      // visual effects in CSS while preserving a tiny JavaScript option set.
      slide.style.setProperty('--wtcg-slide-index', String(originalIndex));
      slide.style.setProperty('--wtcg-slide-render-index', String(renderIndex));
      slide.style.setProperty('--wtcg-slide-offset', String(offset));
      slide.style.setProperty('--wtcg-slide-distance', String(distance));
      slide.style.setProperty('--wtcg-slide-side', String(side));
    });

    this.getActiveRenderIndexes(stateTrackIndex).forEach((renderIndex) => {
      const slide = allSlides[renderIndex];
      if (!slide) return;

      slide.setAttribute('data-wtcg-active', '');
      slide.setAttribute('aria-hidden', 'false');
      slide.inert = false;
    });

    const current = this.getCurrentRenderedSlide(stateTrackIndex);
    if (current) {
      current.setAttribute('data-wtcg-current', '');

      if (this.options.centerMode) current.setAttribute('data-wtcg-center', '');
      if (this.options.focusOnChange) current.tabIndex = 0;
    }
  }

  /**
   * Calculates rendered slide indexes that should be considered visible.
   *
   * @private
   * @returns {number[]}
   */
  getActiveRenderIndexes(trackIndex: number = this.stateTrackIndex): number[] {
    if (!this.slideCount) return [];

    const allSlides = this.allSlides;
    const slides = this.slides;
    const indexes = [];
    const renderIndex = Math.round(trackIndex);

    if (this.options.centerMode) {
      const half = Math.floor(slides / 2);
      const evenOffset = slides % 2 === 0 ? 1 : 0;
      for (let i = renderIndex - half + evenOffset; i <= renderIndex + half; i += 1) {
        if (i >= 0 && i < allSlides.length) indexes.push(i);
      }
      return indexes;
    }

    for (let i = 0; i < Math.min(Math.ceil(slides), this.slideCount); i += 1) {
      const index = renderIndex + i;
      if (index >= 0 && index < allSlides.length) indexes.push(index);
    }

    return indexes;
  }

  /** @private @returns {HTMLElement|undefined} Current rendered slide, clone or original. */
  getCurrentRenderedSlide(trackIndex: number = this.stateTrackIndex): HTMLElement | undefined {
    const allSlides = this.allSlides;
    const index = clamp(Math.round(trackIndex), 0, Math.max(0, allSlides.length - 1));

    return allSlides[index];
  }

  /** @private Enables/disables arrows at non-infinite carousel edges. */
  updateArrows(): void {
    if (!this.prevArrow || !this.nextArrow) return;

    const hidden = !this.canNavigate;
    const disabledPrev = !this.options.infinite && this.currentSlide <= 0;
    const disabledNext = !this.options.infinite && this.currentSlide >= this.maxSlide;

    this.prevArrow.disabled = hidden || disabledPrev;
    this.nextArrow.disabled = hidden || disabledNext;
    this.prevArrow.hidden = hidden;
    this.nextArrow.hidden = hidden;

    this.prevArrow.setAttribute('aria-disabled', String(hidden || disabledPrev));
    this.nextArrow.setAttribute('aria-disabled', String(hidden || disabledNext));
  }

  /** @private Syncs pagination button state with the current slide. */
  updatePagination(): void {
    if (!this.pagination) return;

    const buttons = toArray<HTMLElement>(
      this.pagination.querySelectorAll<HTMLElement>('[data-wtcg-page][data-wtcg-index]'),
    );

    let activeButton = buttons[0];
    buttons.forEach((button) => {
      const index = Number(button.getAttribute('data-wtcg-index'));
      const active = this.currentSlide >= index && this.currentSlide < index + this.scrollAmount;

      button.parentElement?.toggleAttribute('data-wtcg-active', active);
      button.toggleAttribute('data-wtcg-active', active);

      // Pagination controls are plain buttons, not tabs. aria-current communicates
      // the current picker without changing the native button keyboard model.
      if (active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');

      if (active) activeButton = button;
    });

    if (
      !buttons.some((button) => button.parentElement?.hasAttribute('data-wtcg-active')) &&
      activeButton
    ) {
      activeButton.parentElement?.setAttribute('data-wtcg-active', '');
      activeButton.setAttribute('data-wtcg-active', '');
      activeButton.setAttribute('aria-current', 'true');
    }
  }

  /** @private Updates the optional live region from the author's localized template. */
  updateStatus(): void {
    if (!this.status || !this.statusTemplate) return;

    this.status.innerHTML = this.statusTemplate
      .replaceAll(WTC_GORDITO_CAROUSEL_STATUS_TOKENS.CURRENT, String(this.currentSlide + 1))
      .replaceAll(WTC_GORDITO_CAROUSEL_STATUS_TOKENS.TOTAL, String(this.slideCount));
  }

  /** @private Matches list height to the current slide when adaptive height is enabled. */
  setAdaptiveHeight(): void {
    if (!this.list || this.slides !== 1) return;

    const current = this.getOriginalSlideByIndex(this.currentSlide);
    if (current) this.list.style.height = `${current.getBoundingClientRect().height}px`;
  }

  /**
   * Advances by the resolved `--wtcg-scroll` amount.
   *
   * @param {Event} [event] - Optional triggering event, usually from the next arrow.
   */
  next(event?: Event): void {
    if (event) event.preventDefault();

    const current = this.options.infinite ? this.trackIndex - this.cloneCount : this.currentSlide;
    this.changeSlide(current + this.scrollAmount);
  }

  /**
   * Moves backward by the resolved `--wtcg-scroll` amount.
   *
   * @param {Event} [event] - Optional triggering event, usually from the previous arrow.
   */
  prev(event?: Event): void {
    if (event) event.preventDefault();

    const current = this.options.infinite ? this.trackIndex - this.cloneCount : this.currentSlide;
    this.changeSlide(current - this.scrollAmount);
  }

  /**
   * Moves to an exact original slide index.
   *
   * @param {number} index - Zero-based original slide index.
   * @param {boolean} [dontAnimate=false] - Jump immediately using `[data-wtcg-instant]`.
   */
  goTo(index: number, dontAnimate = false): void {
    this.changeSlide(Number(index), dontAnimate);
  }

  /**
   * Internal navigation implementation shared by arrows, pagination, and gestures.
   *
   * @private
   * @param {number} index - Target original slide index, before infinite wrapping.
   * @param {boolean} [dontAnimate=false]
   * @fires wtcg:beforeChange
   */
  changeSlide(index: number, dontAnimate = false): void {
    if (!this.enabled || !this.slideCount) return;
    if (this.animating && this.options.waitForAnimate) return;

    let targetOriginal = index;
    if (!this.options.infinite) {
      targetOriginal = clamp(targetOriginal, 0, this.maxSlide);
    }

    // A move mid-transition that would run past the rendered clones recentres
    // the track first, the same way settling does, then continues from there.
    if (this.animating && this.options.infinite) {
      const visible = Math.ceil(this.slides);
      const lastIndex = this.slideSizes.length - 1;
      const target = this.cloneCount + targetOriginal;

      if (target < visible || target > lastIndex - visible) {
        const shift = this.trackIndex - (this.cloneCount + this.currentSlide);
        this.rebaseMidFlight(shift);
        targetOriginal -= shift;
      }
    }

    const nextSlide = this.options.infinite
      ? modulo(targetOriginal, this.slideCount)
      : targetOriginal;
    const nextTrackIndex = this.options.infinite ? this.cloneCount + targetOriginal : nextSlide;

    dispatch(this.slider, 'beforeChange', {
      carousel: this,
      currentSlide: this.currentSlide,
      nextSlide,
    });

    this.currentSlide = nextSlide;
    this.trackIndex = nextTrackIndex;
    this.animating = true;
    this.updateUI();

    // Without `waitForAnimate`, a new request retargets the running transition
    // and cancels it, which would run this move's callback early. Only the
    // latest move settles: normalizes clones and fires `afterChange`.
    const moveId = ++this.moveId;

    // A mid-flight rebase is still painting; it starts the move to the latest
    // target once it has.
    if (this.rebasing) return;

    this.runPositionChange(dontAnimate, () => this.settleMove(moveId));
  }

  /**
   * Recentres an infinite track by whole slide sets while it is moving.
   *
   * The track and the slide variables are frozen at the currently rendered
   * position, shifted onto identical clones with transitions suppressed, so
   * nothing visibly changes. Once that has painted, the latest move animates
   * on from there.
   *
   * @private
   * @param {number} shift - Rendered slides to shift by, a multiple of the slide count.
   */
  rebaseMidFlight(shift: number): void {
    const offset =
      this.getRenderedOffset() +
      this.getTrackOffsetByIndex(this.trackIndex - shift) -
      this.getTrackOffsetByIndex(this.trackIndex);

    this.trackIndex -= shift;
    this.moveId += 1;
    this.rebasing = true;

    // The drag preview drives slide variables from an arbitrary offset, which
    // keeps fractional `--wtcg-slide-offset` effects where they are.
    this.updateDragPreview(offset);

    this.runInstantPosition(() => {
      if (!this.rebasing) return;

      this.rebasing = false;
      this.clearDragPreview();
      this.updateSlideClasses();

      const moveId = this.moveId;
      this.runPositionChange(false, () => this.settleMove(moveId));
    }, offset);
  }

  /**
   * Settles the latest move once the track stops: normalizes infinite clones,
   * then fires `afterChange`. Superseded moves are ignored.
   *
   * @private
   * @param {number} moveId - The move being settled.
   */
  settleMove(moveId: number): void {
    if (moveId !== this.moveId) return;

    const index = this.currentSlide;

    if (this.options.infinite) {
      const originalStart = this.cloneCount;
      const originalEnd = this.cloneCount + this.slideCount;

      if (this.trackIndex < originalStart || this.trackIndex >= originalEnd) {
        this.trackIndex = this.cloneCount + index;
        // Clone count provides visual buffer, but logical state should not sit
        // on cloned rendered slides. Normalize as soon as the current rendered
        // slide leaves the original band so arrows, drag, pagination, and
        // focusOnSelect all behave consistently.
        // Runtime CSS variables are refreshed during this invisible correction;
        // otherwise effects based on offset/distance would animate too.
        this.updateUI(false);
        this.runInstantPosition(() => this.postSlide(index));

        return;
      }
    }
    this.postSlide(index);
  }

  /**
   * Completes a navigation after CSS transform transition finishes.
   *
   * @private
   * @param {number} index - Current original slide index after movement.
   * @fires wtcg:afterChange
   */
  postSlide(index: number): void {
    this.animating = false;

    if (this.options.adaptiveHeight) this.setAdaptiveHeight();
    if (this.options.focusOnChange) {
      const current = this.getCurrentRenderedSlide() || this.getOriginalSlideByIndex(index);
      if (current) current.focus({ preventScroll: true });
    }

    dispatch(this.slider, 'afterChange', {
      carousel: this,
      currentSlide: index,
    });
  }

  /** @private Debounced resize/orientation handler. */
  handleResize(): void {
    window.clearTimeout(this.windowTimer as number | undefined);

    this.windowTimer = window.setTimeout(() => {
      const nextSlides = this.slides;
      const nextScroll = this.scrollAmount;
      if (nextSlides !== this.renderedSlides || nextScroll !== this.renderedScroll) {
        this.refresh(false);
      } else {
        this.setPosition();
      }
    }, 50);
  }

  /**
   * Repositions after media loads because intrinsic dimensions can affect slide widths.
   *
   * @private
   * @param {Event} event
   */
  handleMediaLoad(event: Event): void {
    if (event.target instanceof Element) this.setPosition();
  }

  /**
   * Starts pointer drag/swipe tracking.
   *
   * @private
   * @param {PointerEvent} event
   */
  handlePointerDown(event: PointerEvent): void {
    if (!this.isDraggable || !event.isPrimary || event.button !== 0 || this.pointer) return;
    if (this.animating && this.options.waitForAnimate) return;

    // Grabbing the track mid-transition: freeze it where it is rendered so the
    // drag starts under the pointer. The interrupted move settles on release.
    const interrupted = this.animating;
    let startOffset = this.trackOffset;

    this.clearDragPreview();

    if (interrupted) {
      this.moveId += 1;
      this.animating = false;
      this.rebasing = false;
      this.slider.setAttribute('data-wtcg-dragging', '');
      startOffset = this.applyPosition(this.getRenderedOffset());
      // Slide variables follow the frozen position too, rather than snapping
      // to the abandoned target while transitions are suppressed.
      this.updateDragPreview(startOffset);
    }

    window.clearTimeout(this.pointerDownSlideTimer as number | undefined);
    this.pointerDownSlide =
      event.target instanceof Element
        ? (event.target.closest('[data-wtcg-slide]') as HTMLElement | null)
        : null;

    this.pointer = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startOffset,
      currentOffset: startOffset,
      moved: false,
      interrupted,
    };

    this.dragging = true;
    this.slider.setAttribute('data-wtcg-dragging', '');
    this.list.setPointerCapture(event.pointerId);
  }

  /**
   * Updates drag/swipe visual movement.
   *
   * @private
   * @param {PointerEvent} event
   */
  handlePointerMove(event: PointerEvent): void {
    if (!this.dragging || !this.pointer || event.pointerId !== this.pointer.id) return;

    const deltaX = event.clientX - this.pointer.startX;
    const deltaY = event.clientY - this.pointer.startY;
    const mainDelta = deltaX;
    const crossDelta = deltaY;

    if (Math.abs(crossDelta) > Math.abs(mainDelta) && Math.abs(crossDelta) > 8) return;

    if (Math.abs(mainDelta) > 4) {
      event.preventDefault();

      this.pointer.moved = true;

      let dampened = mainDelta;
      if (!this.options.infinite) {
        const atStart = this.currentSlide <= 0 && mainDelta > 0;
        const atEnd = this.currentSlide >= this.maxSlide && mainDelta < 0;

        if (atStart || atEnd) dampened *= this.options.edgeFriction;
      }

      this.pointer.currentOffset = this.pointer.startOffset + dampened;
      this.applyPosition(this.pointer.currentOffset);
      this.updateDragPreview(this.pointer.currentOffset);
    }

    this.pointer.lastX = event.clientX;
    this.pointer.lastY = event.clientY;
  }

  /**
   * Finishes pointer drag/swipe tracking and optionally navigates.
   *
   * @private
   * @param {PointerEvent} event
   * @fires wtcg:swipe
   */
  handlePointerUp(event: PointerEvent): void {
    if (!this.dragging || !this.pointer || event.pointerId !== this.pointer.id) return;

    const deltaX = event.clientX - this.pointer.startX;
    const mainDelta = deltaX;
    const minSwipe = this.list.getBoundingClientRect().width / this.options.touchThreshold;

    this.dragging = false;
    this.slider.removeAttribute('data-wtcg-dragging');

    // I actually didn't know that this could throw but it did
    // If the pointerId can't be found it throws
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/releasePointerCapture
    try {
      this.list.releasePointerCapture(event.pointerId);
    } catch {}

    const releaseOffset = this.pointer.currentOffset;
    const { interrupted } = this.pointer;
    this.clearDragPreview();
    this.updateSlideClasses();

    // Returns to the current slide. A move grabbed mid-transition never
    // settled, so it settles once the track gets there.
    const snapBack = () => {
      if (!interrupted) {
        this.runPositionChange(false);
        return;
      }

      const moveId = ++this.moveId;
      this.animating = true;
      this.runPositionChange(false, () => this.settleMove(moveId));
    };

    if (Math.abs(mainDelta) >= minSwipe) {
      const forward = mainDelta < 0;

      dispatch(this.slider, 'swipe', {
        carousel: this,
        direction: forward ? 'next' : 'previous',
      });

      if (this.dragMode === 'free') {
        // In peek/center layouts, users can drag across several visible slides.
        // Free drag honors the actual release position instead of forcing
        // every swipe through the fixed `--wtcg-scroll` step.
        const targetTrackIndex = this.getTrackIndexForOffset(releaseOffset);
        const targetOriginal = targetTrackIndex - this.cloneCount;
        const nextSlide = this.options.infinite
          ? modulo(targetOriginal, this.slideCount)
          : targetOriginal;

        if (nextSlide === this.currentSlide) snapBack();
        else this.changeSlide(targetOriginal);
      } else if (forward) this.next();
      else this.prev();
    } else {
      snapBack();
    }

    this.shouldSuppressClick = Boolean(this.pointer.moved);
    this.pointer = null;

    window.clearTimeout(this.pointerDownSlideTimer as number | undefined);
    this.pointerDownSlideTimer = window.setTimeout(() => {
      this.pointerDownSlide = null;
    }, 500);
  }

  /**
   * Suppresses click after drag and handles `focusOnSelect` slide selection.
   *
   * @private
   * @param {MouseEvent} event
   */
  handleClick(event: MouseEvent): void {
    if (this.shouldSuppressClick) {
      event.preventDefault();
      this.shouldSuppressClick = false;
      this.pointerDownSlide = null;

      return;
    }

    if (!this.options.focusOnSelect) {
      this.pointerDownSlide = null;
      return;
    }

    const clickedSlide =
      event.target instanceof Element
        ? (event.target.closest('[data-wtcg-slide]') as HTMLElement | null)
        : null;
    const slide = clickedSlide || (this.isDraggable ? this.pointerDownSlide : null);
    this.pointerDownSlide = null;

    if (!slide) return;

    const index = Number(slide.getAttribute('data-wtcg-index'));
    if (!Number.isFinite(index)) return;

    const nextSlide = modulo(index, this.slideCount);
    if (nextSlide !== this.currentSlide) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.changeSlide(index);
  }

  /**
   * Calculates the original slide indexes represented by pagination controls.
   *
   * @private
   * @returns {number[]}
   */
  get paginationIndexes(): number[] {
    const indexes = [];
    const slides = this.slides;
    const scroll = this.scrollAmount;

    if (!this.canNavigate) return [0];

    const max = this.maxSlide;
    let index = 0;
    while (index <= max) {
      indexes.push(index);
      index += scroll <= slides ? scroll : slides;
    }

    if (!this.options.infinite && indexes[indexes.length - 1] !== max) indexes.push(max);

    return indexes;
  }

  /**
   * Current original slide index.
   *
   * @returns {number}
   */
  get current(): number {
    return this.currentSlide;
  }

  /**
   * Returns a runtime option value.
   *
   * @param {keyof WtcGorditoCarouselOptions|string} option - Option name.
   * @returns {*}
   */
  getOption(option: keyof WtcGorditoCarouselOptions | string): unknown {
    return this.options[option as keyof WtcGorditoCarouselOptions];
  }

  /**
   * Updates one or more runtime options.
   *
   * Pass `refresh: true` when the option changes generated DOM or layout, such as
   * `pagination` or `arrows`.
   *
   * @param {keyof WtcGorditoCarouselOptions|string|Partial<WtcGorditoCarouselOptions>} option - Option name or an object of option values.
   * @param {*} [value] - New value, or refresh boolean when `option` is an object.
   * @param {boolean} [refresh=false] - Whether to rebuild after updating.
   */
  setOption(
    option: string | Partial<WtcGorditoCarouselOptions>,
    value?: WtcGorditoCarouselOptionValue | boolean,
    refresh = false,
  ): void {
    if (option && typeof option === 'object' && option.constructor === Object) {
      Object.assign(this.options, option);
      refresh = Boolean(value);
    } else if (typeof option === 'string') {
      (this.options as unknown as Record<string, unknown>)[option] = value;
    }

    if (refresh) this.refresh();
  }

  /**
   * Adds a slide and rebuilds the carousel.
   *
   * Prefer changing DOM declaratively in framework integrations. This method exists
   * for direct DOM usage.
   *
   * @param {HTMLElement|string} markup - Element or HTML string for the new slide.
   * @param {number} [index=this.slideCount] - Reference slide index.
   * @param {boolean} [addBefore=false] - Insert before `index` instead of after it.
   * @fires wtcg:reInit
   */
  addSlide(markup: HTMLElement | string, index = this.slideCount, addBefore = false): void {
    let element: HTMLElement = markup as HTMLElement;
    if (!(markup instanceof HTMLElement)) {
      // Parses an HTML string into a single `Element`.
      // Uses a `<template>` element to avoid side effects like loading images or
      // executing scripts during parsing.
      const template = document.createElement('template');

      template.innerHTML = markup.trim();
      element = template.content.firstElementChild as HTMLElement;
    }

    const target = addBefore ? index : index + 1;

    this.destroy(true);

    const slides = this.collectDirectSlides();
    const before = slides[target] || null;

    element.setAttribute('data-wtcg-slide', '');

    this.track.insertBefore(element, before);

    this.slider.removeAttribute('data-wtcg-initialized');

    this.init(false);

    dispatch(this.slider, 'reInit', { carousel: this });
  }

  /**
   * Removes one or all slides and rebuilds the carousel.
   *
   * @param {number} index - Reference slide index.
   * @param {boolean} [removeBefore=false] - Remove the slide before `index` instead of `index` itself.
   * @param {boolean} [removeAll=false] - Remove all slides.
   * @fires wtcg:reInit
   */
  removeSlide(index: number, removeBefore = false, removeAll = false): void {
    this.destroy(true);

    const slides = this.collectDirectSlides();
    if (removeAll) slides.forEach((slide) => slide.remove());
    else {
      const targetIndex = removeBefore ? index - 1 : index;
      const slide = slides[targetIndex];
      if (slide) slide.remove();
    }

    this.slider.removeAttribute('data-wtcg-initialized');

    this.init(false);

    dispatch(this.slider, 'reInit', { carousel: this });
  }

  /**
   * Filters original slides and rebuilds the carousel.
   *
   * @param {string|((slide: HTMLElement, index: number) => boolean)} filter - CSS selector or predicate.
   * @fires wtcg:reInit
   */
  filterSlides(filter: string | ((slide: HTMLElement, index: number) => boolean)): void {
    this.destroy(true);

    const all = this.collectDirectSlides();
    this.filteredSlides =
      typeof filter === 'function'
        ? all.filter((slide, index) => filter(slide, index))
        : all.filter((slide) => slide.matches(filter));

    this.slider.removeAttribute('data-wtcg-initialized');

    this.init(false);

    dispatch(this.slider, 'reInit', { carousel: this });
  }

  /**
   * Removes any active slide filter and rebuilds the carousel.
   *
   * @fires wtcg:reInit
   */
  unfilterSlides(): void {
    this.destroy(true);

    this.filteredSlides = null;

    this.collectDirectSlides().forEach((slide) => {
      slide.hidden = false;
      slide.removeAttribute('data-wtcg-filtered');
    });

    this.slider.removeAttribute('data-wtcg-initialized');

    this.init(false);

    dispatch(this.slider, 'reInit', { carousel: this });
  }

  /**
   * Initializes every element matching a selector.
   *
   * @param {string} [selector="[data-wtcg-carousel]"] - Elements to initialize.
   * @param {Partial<WtcGorditoCarouselOptions>} [options={}] - Options shared by every instance.
   * @returns {WtcGorditoCarousel[]}
   */
  static initAll(
    selector = '[data-wtcg-carousel]',
    options: Partial<WtcGorditoCarouselOptions> = {},
  ): WtcGorditoCarousel[] {
    return toArray<HTMLElement>(document.querySelectorAll<HTMLElement>(selector)).map(
      (element) => new WtcGorditoCarousel(element, options),
    );
  }
}
