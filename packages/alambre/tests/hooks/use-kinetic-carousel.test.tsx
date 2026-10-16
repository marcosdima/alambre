import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKineticCarousel,
  useKineticCarouselItem,
  KineticCarouselProvider,
} from '../../src/hooks/use-kinetic-carousel';

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  return {
    useSharedValue: (initial: any) => {
      const ref = React.useRef({ value: initial });
      return ref.current;
    },
    useAnimatedStyle: (factory: () => unknown) => factory(),
    useAnimatedScrollHandler: (_handlers: any) => vi.fn(),
  };
});

describe('useKineticCarousel hook', () => {
  it('calculates snapInterval correctly and initializes activeIndex', () => {
    const { result } = renderHook(() =>
      useKineticCarousel({
        itemWidth: 200,
        itemGap: 20,
        totalItems: 5,
        initialIndex: 2,
      }),
    );

    expect(result.current.snapInterval).toBe(220);
    expect(result.current.activeIndex).toBe(2);
    expect(result.current.scrollProps.horizontal).toBe(true);
    expect(result.current.scrollProps.snapToInterval).toBe(220);
  });

  it('updates index on next and prev', () => {
    const { result } = renderHook(() =>
      useKineticCarousel({
        itemWidth: 100,
        itemGap: 10,
        totalItems: 3,
        initialIndex: 0,
      }),
    );

    act(() => {
      result.current.next(false);
    });
    expect(result.current.activeIndex).toBe(1);

    act(() => {
      result.current.next(false);
    });
    expect(result.current.activeIndex).toBe(2);

    act(() => {
      result.current.next(false);
    });
    // Wraps around
    expect(result.current.activeIndex).toBe(0);

    act(() => {
      result.current.prev(false);
    });
    // Wraps to end
    expect(result.current.activeIndex).toBe(2);
  });

  it('throws descriptive error if useKineticCarouselItem is called without context or carousel option', () => {
    expect(() => {
      renderHook(() => useKineticCarouselItem(0));
    }).toThrowError(/useKineticCarouselItem must be used within a KineticCarouselProvider/);
  });

  it('renders item animated style correctly when wrapped in KineticCarouselProvider', () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      const carousel = useKineticCarousel({
        itemWidth: 100,
        itemGap: 10,
        totalItems: 3,
        preset: 'scale-fade',
      });
      return <KineticCarouselProvider value={carousel}>{children}</KineticCarouselProvider>;
    };

    const { result } = renderHook(() => useKineticCarouselItem(0), { wrapper: Wrapper });

    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.getItemDistance).toBeDefined();
    expect(result.current.getItemDistance(0)).toBe(0);
  });
});
