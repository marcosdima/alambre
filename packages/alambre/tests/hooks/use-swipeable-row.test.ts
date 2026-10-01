import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSwipeableRow } from '../../src/hooks/use-swipeable-row';

// Mock Reanimated
vi.mock('react-native-reanimated', () => {
  const Reanimated = {
    useSharedValue: (initialValue: any) => ({ value: initialValue }),
    withSpring: (toValue: any, config: any, cb: any) => {
      if (cb) cb(true);
      return toValue;
    },
    runOnJS: (fn: any) => fn,
  };
  return Reanimated;
});

// Mock Gesture Handler
vi.mock('react-native-gesture-handler', () => {
  return {
    Gesture: {
      Pan: () => {
        const callbacks: any = {};
        const builder = {
          activeOffsetX: () => builder,
          failOffsetY: () => builder,
          onStart: (cb: any) => { callbacks.onStart = cb; return builder; },
          onUpdate: (cb: any) => { callbacks.onUpdate = cb; return builder; },
          onEnd: (cb: any) => { callbacks.onEnd = cb; return builder; },
          _simulateStart: () => { if (callbacks.onStart) callbacks.onStart(); },
          _simulateUpdate: (event: any) => { if (callbacks.onUpdate) callbacks.onUpdate(event); },
          _simulateEnd: (event: any) => { if (callbacks.onEnd) callbacks.onEnd(event); },
        };
        return builder;
      },
    },
  };
});

describe('useSwipeableRow', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useSwipeableRow());
    expect(result.current.translationX.value).toBe(0);
    expect(result.current.panGesture).toBeDefined();
  });

  it('snaps to points on release', () => {
    const onSnap = vi.fn();
    const { result } = renderHook(() => useSwipeableRow({
      leftSnapPoints: [100],
      onSnap,
    }));

    act(() => {
      (result.current.panGesture as any)._simulateStart();
      (result.current.panGesture as any)._simulateUpdate({ translationX: 80 });
      // Velocity high enough to snap to 100
      (result.current.panGesture as any)._simulateEnd({ velocityX: 1000 });
    });

    expect(result.current.translationX.value).toBe(100);
    expect(onSnap).toHaveBeenCalledWith('left', 100);
  });

  it('triggers action if over triggerThreshold', () => {
    const onActionTriggered = vi.fn();
    const { result } = renderHook(() => useSwipeableRow({
      leftSnapPoints: [100],
      triggerThreshold: 150,
      onActionTriggered,
      friction: 1, // less friction to easily pass threshold
    }));

    act(() => {
      (result.current.panGesture as any)._simulateStart();
      (result.current.panGesture as any)._simulateUpdate({ translationX: 200 }); // (200 - 100) = 100 overscroll -> 100 / (1 + 0.3) = 76 => 176 > 150
      (result.current.panGesture as any)._simulateEnd({ velocityX: 0 });
    });

    // Should snap back to maxLeft
    expect(result.current.translationX.value).toBe(100);
    expect(onActionTriggered).toHaveBeenCalledWith('left');
  });

  it('applies friction over boundaries', () => {
    const { result } = renderHook(() => useSwipeableRow({
      leftSnapPoints: [100],
      friction: 0.5,
    }));

    act(() => {
      (result.current.panGesture as any)._simulateStart();
      // Overscroll past 100
      (result.current.panGesture as any)._simulateUpdate({ translationX: 200 });
    });

    // It should be > 100 but < 200 due to friction
    expect(result.current.translationX.value).toBeGreaterThan(100);
    expect(result.current.translationX.value).toBeLessThan(200);
  });
});
