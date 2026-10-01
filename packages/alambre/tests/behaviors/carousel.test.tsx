import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
  useCarousel,
  calculateSnapInterval,
  calculateActiveIndex,
  getScrollTargetForIndex,
} from '../../src/behaviors/carousel';

import { useRef } from 'react';

vi.mock('react-native-reanimated', () => ({
  useSharedValue: (val: unknown) => {
    const ref = useRef({ value: val });
    return ref.current;
  },
  useAnimatedScrollHandler: vi.fn((handler: unknown) => handler),
}));

describe('carousel behavior — pure math calculations', () => {
  describe('calculateSnapInterval', () => {
    it('sums cardWidth and cardGap and rounds the result', () => {
      expect(calculateSnapInterval(300, 16)).toBe(316);
      expect(calculateSnapInterval(280.4, 12.2)).toBe(293);
      expect(calculateSnapInterval(250, 0)).toBe(250);
    });

    it('handles negative or zero dimensions safely', () => {
      expect(calculateSnapInterval(0, 0)).toBe(0);
      expect(calculateSnapInterval(100, -10)).toBe(90);
    });
  });

  describe('calculateActiveIndex', () => {
    it('calculates the closest index based on snap interval', () => {
      const snap = 300;
      const total = 5;
      expect(calculateActiveIndex(0, snap, total)).toBe(0);
      expect(calculateActiveIndex(100, snap, total)).toBe(0); // 100/300 = 0.33 -> 0
      expect(calculateActiveIndex(151, snap, total)).toBe(1); // 151/300 = 0.503 -> 1
      expect(calculateActiveIndex(300, snap, total)).toBe(1);
      expect(calculateActiveIndex(450, snap, total)).toBe(2);
      expect(calculateActiveIndex(600, snap, total)).toBe(2);
      expect(calculateActiveIndex(1200, snap, total)).toBe(4);
    });

    it('clamps to [0, totalItems - 1]', () => {
      const snap = 200;
      const total = 3;
      expect(calculateActiveIndex(-500, snap, total)).toBe(0);
      expect(calculateActiveIndex(10000, snap, total)).toBe(2);
    });

    it('returns 0 when snapInterval or totalItems are non-positive', () => {
      expect(calculateActiveIndex(100, 0, 5)).toBe(0);
      expect(calculateActiveIndex(100, -50, 5)).toBe(0);
      expect(calculateActiveIndex(100, 300, 0)).toBe(0);
      expect(calculateActiveIndex(100, 300, -2)).toBe(0);
    });
  });

  describe('getScrollTargetForIndex', () => {
    it('computes exact scroll offset for given target index', () => {
      const snap = 250;
      const total = 4;
      expect(getScrollTargetForIndex(0, snap, total)).toBe(0);
      expect(getScrollTargetForIndex(1, snap, total)).toBe(250);
      expect(getScrollTargetForIndex(2, snap, total)).toBe(500);
      expect(getScrollTargetForIndex(3, snap, total)).toBe(750);
    });

    it('clamps target offset between 0 and last card offset', () => {
      const snap = 200;
      const total = 4;
      expect(getScrollTargetForIndex(-5, snap, total)).toBe(0);
      expect(getScrollTargetForIndex(10, snap, total)).toBe(600); // index 3 * 200
    });

    it('returns 0 when totalItems is <= 0', () => {
      expect(getScrollTargetForIndex(2, 200, 0)).toBe(0);
      expect(getScrollTargetForIndex(2, 200, -1)).toBe(0);
    });
  });
});

describe('useCarousel hook behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with activeIndex 0 and computed snapInterval', () => {
    const { result } = renderHook(() =>
      useCarousel({
        cardWidth: 300,
        cardGap: 20,
        totalItems: 4,
      }),
    );

    expect(result.current.activeIndex).toBe(0);
    expect(result.current.snapInterval).toBe(320);
    expect(result.current.scrollRef.current).toBeNull();
  });

  it('updates activeIndex on momentum scroll end event', () => {
    const { result } = renderHook(() =>
      useCarousel({
        cardWidth: 200,
        cardGap: 10,
        totalItems: 5,
      }),
    );

    const event = {
      nativeEvent: {
        contentOffset: { x: 420, y: 0 },
      },
    } as NativeSyntheticEvent<NativeScrollEvent>;

    act(() => {
      result.current.onMomentumScrollEnd(event);
    });

    // 420 / 210 = 2
    expect(result.current.activeIndex).toBe(2);
  });

  it('scrollToIndex updates activeIndex and calls scrollRef.scrollTo', () => {
    const { result } = renderHook(() =>
      useCarousel({
        cardWidth: 300,
        cardGap: 0,
        totalItems: 5,
      }),
    );

    const scrollToMock = vi.fn();
    // Simulate scroll view ref
    (result.current.scrollRef as unknown as { current: { scrollTo: typeof scrollToMock } }).current = {
      scrollTo: scrollToMock,
    };

    act(() => {
      result.current.scrollToIndex(3);
    });

    expect(result.current.activeIndex).toBe(3);
    expect(scrollToMock).toHaveBeenCalledWith({
      x: 900,
      animated: true,
    });
  });

  it('does not advance automatically when autoPlay is false', () => {
    const { result } = renderHook(() =>
      useCarousel({
        cardWidth: 300,
        cardGap: 10,
        totalItems: 3,
        autoPlay: false,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.activeIndex).toBe(0);
  });

  it('advances activeIndex on autoPlay interval and wraps around', () => {
    const scrollToMock = vi.fn();

    const { result } = renderHook(() =>
      useCarousel({
        cardWidth: 300,
        cardGap: 0,
        totalItems: 3,
        autoPlay: true,
        autoPlayInterval: 2000,
      }),
    );

    (result.current.scrollRef as unknown as { current: { scrollTo: typeof scrollToMock } }).current = {
      scrollTo: scrollToMock,
    };

    expect(result.current.activeIndex).toBe(0);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.activeIndex).toBe(1);
    expect(scrollToMock).toHaveBeenLastCalledWith({ x: 300, animated: true });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.activeIndex).toBe(2);
    expect(scrollToMock).toHaveBeenLastCalledWith({ x: 600, animated: true });

    // Wraps around to 0
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.activeIndex).toBe(0);
    expect(scrollToMock).toHaveBeenLastCalledWith({ x: 0, animated: true });
  });

  it('does not start autoPlay timer when totalItems is 0', () => {
    const { result } = renderHook(() =>
      useCarousel({
        cardWidth: 300,
        cardGap: 10,
        totalItems: 0,
        autoPlay: true,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.activeIndex).toBe(0);
  });
});
