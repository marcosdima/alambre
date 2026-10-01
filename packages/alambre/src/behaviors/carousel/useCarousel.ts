import { useCallback, useRef, useState, useEffect } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type Animated from 'react-native-reanimated';
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

export function calculateSnapInterval(cardWidth: number, cardGap: number): number {
  return Math.round(cardWidth + cardGap);
}

export function calculateActiveIndex(
  scrollX: number,
  snapInterval: number,
  totalItems: number,
): number {
  if (snapInterval <= 0 || totalItems <= 0) return 0;
  const raw = Math.round(scrollX / snapInterval);
  return Math.max(0, Math.min(raw, totalItems - 1));
}

export function getScrollTargetForIndex(
  index: number,
  snapInterval: number,
  totalItems: number,
): number {
  if (totalItems <= 0) return 0;
  const clamped = Math.max(0, Math.min(index, totalItems - 1));
  return clamped * snapInterval;
}

export type UseCarouselConfig = {
  cardWidth: number;
  cardGap: number;
  totalItems: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
};

export function useCarousel(config: UseCarouselConfig) {
  const { cardWidth, cardGap, totalItems, autoPlay = false, autoPlayInterval = 3000 } = config;

  const snapInterval = calculateSnapInterval(cardWidth, cardGap);
  const scrollRef = useRef<Animated.ScrollView>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const idx = calculateActiveIndex(offsetX, snapInterval, totalItems);
      setActiveIndex(idx);
    },
    [snapInterval, totalItems],
  );

  const scrollToIndex = useCallback((index: number) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({
      x: getScrollTargetForIndex(index, snapInterval, totalItems),
      animated: true,
    });
  }, [snapInterval, totalItems]);

  useEffect(() => {
    if (!autoPlay || totalItems <= 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % totalItems;
        scrollRef.current?.scrollTo({
          x: getScrollTargetForIndex(next, snapInterval, totalItems),
          animated: true,
        });
        return next;
      });
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, snapInterval, totalItems]);

  return {
    scrollRef,
    scrollX,
    scrollHandler,
    onMomentumScrollEnd,
    activeIndex,
    scrollToIndex,
    snapInterval,
  };
}
