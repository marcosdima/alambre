import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type Animated from 'react-native-reanimated';
import {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import {
  calculateCarouselTransform,
  type CarouselItemTransform,
  type CarouselPreset,
} from '../core/spatial';

export interface UseKineticCarouselOptions {
  /** Width in points of a single carousel item. */
  itemWidth: number;
  /** Gap between items in points. @default 12 */
  itemGap?: number;
  /** Total number of items in carousel. */
  totalItems: number;
  /** Visual kinetic transformation preset. @default 'scale-fade' */
  preset?: CarouselPreset;
  /** Whether to auto-play (advance periodically). @default false */
  autoPlay?: boolean;
  /** Interval in ms between auto-play advances. @default 3000 */
  autoPlayInterval?: number;
  /** Initial active index. @default 0 */
  initialIndex?: number;
  /** Callback when active index changes. */
  onIndexChange?: (index: number) => void;
}

export interface UseKineticCarouselReturn {
  scrollRef: RefObject<Animated.ScrollView | null>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  /**
   * Pre-configured spreadable props for `<Animated.ScrollView {...carousel.scrollProps}>`
   * Fulfills the 3-line rule by bundling scroll handlers, throttle, horizontal layout, and snapping.
   */
  scrollProps: {
    ref: RefObject<Animated.ScrollView | null>;
    onScroll: ReturnType<typeof useAnimatedScrollHandler>;
    scrollEventThrottle: number;
    horizontal: boolean;
    showsHorizontalScrollIndicator: boolean;
    snapToInterval: number;
    decelerationRate: 'fast';
    onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  };
  scrollX: SharedValue<number>;
  activeIndex: number;
  activeSharedIndex: SharedValue<number>;
  snapInterval: number;
  preset: CarouselPreset;
  scrollToIndex: (index: number, animated?: boolean) => void;
  next: (animated?: boolean) => void;
  prev: (animated?: boolean) => void;
  /**
   * Pure worklet returning normalized distance from scroll center: (scrollX - index * snapInterval) / snapInterval
   */
  getItemDistance: (index: number, scrollXOverride?: number) => number;
}

export function useKineticCarousel(
  options: UseKineticCarouselOptions,
): UseKineticCarouselReturn {
  const {
    itemWidth,
    itemGap = 12,
    totalItems,
    preset = 'scale-fade',
    autoPlay = false,
    autoPlayInterval = 3000,
    initialIndex = 0,
    onIndexChange,
  } = options;

  const snapInterval = Math.max(1, Math.round(itemWidth + itemGap));
  const scrollRef = useRef<Animated.ScrollView | null>(null);

  const initialClamped = Math.max(0, Math.min(initialIndex, Math.max(0, totalItems - 1)));
  const [activeIndex, setActiveIndex] = useState(initialClamped);
  const activeIndexRef = useRef(initialClamped);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const scrollX = useSharedValue(initialIndex * snapInterval);
  const activeSharedIndex = useSharedValue(initialIndex);

  const isInteractingRef = useRef(false);
  const onIndexChangeRef = useRef(onIndexChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollX.value = event.contentOffset.x;
      activeSharedIndex.value = event.contentOffset.x / snapInterval;
    },
    onBeginDrag: () => {
      'worklet';
      // Handled via JS ref on scrollProps if needed, marked here for worklet safety
    },
  });

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isInteractingRef.current = false;
      const offsetX = event.nativeEvent.contentOffset.x;
      const raw = Math.round(offsetX / snapInterval);
      const clamped = Math.max(0, Math.min(raw, Math.max(0, totalItems - 1)));
      activeIndexRef.current = clamped;
      setActiveIndex(clamped);
      onIndexChangeRef.current?.(clamped);
    },
    [snapInterval, totalItems],
  );

  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      if (totalItems <= 0) return;
      const clamped = Math.max(0, Math.min(index, totalItems - 1));
      activeIndexRef.current = clamped;
      setActiveIndex(clamped);
      scrollRef.current?.scrollTo({
        x: clamped * snapInterval,
        animated,
      });
      onIndexChangeRef.current?.(clamped);
    },
    [snapInterval, totalItems],
  );

  const next = useCallback(
    (animated = true) => {
      if (totalItems <= 0) return;
      const nextIdx = (activeIndex + 1) % totalItems;
      scrollToIndex(nextIdx, animated);
    },
    [activeIndex, scrollToIndex, totalItems],
  );

  const prev = useCallback(
    (animated = true) => {
      if (totalItems <= 0) return;
      const prevIdx = activeIndex === 0 ? totalItems - 1 : activeIndex - 1;
      scrollToIndex(prevIdx, animated);
    },
    [activeIndex, scrollToIndex, totalItems],
  );

  // Auto-play timer with active interaction pause
  useEffect(() => {
    if (!autoPlay || totalItems <= 1) return;

    const interval = setInterval(() => {
      if (!isInteractingRef.current) {
        const nextIdx = (activeIndexRef.current + 1) % totalItems;
        activeIndexRef.current = nextIdx;
        setActiveIndex(nextIdx);
        scrollRef.current?.scrollTo({
          x: nextIdx * snapInterval,
          animated: true,
        });
        onIndexChangeRef.current?.(nextIdx);
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, snapInterval, totalItems]);

  const getItemDistance = useCallback(
    (index: number, scrollXOverride?: number): number => {
      'worklet';
      const x = scrollXOverride ?? scrollX.value;
      return (x - index * snapInterval) / snapInterval;
    },
    [scrollX, snapInterval],
  );

  const scrollProps = useMemo(() => {
    return {
      ref: scrollRef,
      onScroll: scrollHandler,
      scrollEventThrottle: 16,
      horizontal: true as const,
      showsHorizontalScrollIndicator: false,
      snapToInterval: snapInterval,
      decelerationRate: 'fast' as const,
      onMomentumScrollEnd,
      onScrollBeginDrag: () => {
        isInteractingRef.current = true;
      },
      onScrollEndDrag: () => {
        isInteractingRef.current = false;
      },
    };
  }, [onMomentumScrollEnd, scrollHandler, snapInterval]);

  return {
    scrollRef,
    scrollHandler,
    scrollProps,
    scrollX,
    activeIndex,
    activeSharedIndex,
    snapInterval,
    preset,
    scrollToIndex,
    next,
    prev,
    getItemDistance,
  };
}

// ============================================================================
// Context & Provider for 3-Line Rule ergonomics
// ============================================================================

export const KineticCarouselContext = createContext<UseKineticCarouselReturn | null>(null);

export interface KineticCarouselProviderProps {
  value: UseKineticCarouselReturn;
  children: ReactNode;
}

export function KineticCarouselProvider({ value, children }: KineticCarouselProviderProps) {
  return (
    <KineticCarouselContext.Provider value={value}>
      {children}
    </KineticCarouselContext.Provider>
  );
}

// ============================================================================
// Item Hook: safe from Rule of Hooks in loops
// ============================================================================

export interface UseKineticCarouselItemOptions {
  /** Optional explicit carousel instance when not using KineticCarouselProvider */
  carousel?: UseKineticCarouselReturn;
  /** Visual preset override for this item */
  preset?: CarouselPreset;
  /** Custom worklet transforming normalized distance [-infinity, +infinity] into transform styles */
  customTransform?: (normalizedDistance: number) => CarouselItemTransform;
}

export interface UseKineticCarouselItemReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  getItemDistance: (scrollXOverride?: number) => number;
}

export function useKineticCarouselItem(
  index: number,
  options: UseKineticCarouselItemOptions = {},
): UseKineticCarouselItemReturn {
  const context = useContext(KineticCarouselContext);
  const carousel = options.carousel ?? context;

  if (!carousel) {
    throw new Error(
      'useKineticCarouselItem must be used within a KineticCarouselProvider or passed an explicit `carousel` option.',
    );
  }

  const { scrollX, snapInterval, preset: defaultPreset } = carousel;
  const activePreset = options.preset ?? defaultPreset;
  const customTransform = options.customTransform;

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const distance = (scrollX.value - index * snapInterval) / snapInterval;

    if (customTransform) {
      const res = customTransform(distance);
      return {
        transform: res.transform as any,
        opacity: res.opacity,
        zIndex: res.zIndex,
      };
    }

    const res = calculateCarouselTransform(distance, activePreset);
    return {
      transform: res.transform as any,
      opacity: res.opacity,
      zIndex: res.zIndex,
    };
  }, [activePreset, customTransform, index, snapInterval]);

  const getItemDistance = useCallback(
    (scrollXOverride?: number) => {
      'worklet';
      const x = scrollXOverride ?? scrollX.value;
      return (x - index * snapInterval) / snapInterval;
    },
    [index, scrollX, snapInterval],
  );

  return {
    animatedStyle,
    getItemDistance,
  };
}
