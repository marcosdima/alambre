import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKineticSwipe } from '../../src/hooks/use-kinetic-swipe';

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  return {
    useReducedMotion: vi.fn(() => false),
    useSharedValue: (initial: any) => {
      const ref = React.useRef({ value: initial });
      return ref.current;
    },
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withSpring: (toValue: number, _config: any, cb?: (finished: boolean) => void) => {
      if (cb) cb(true);
      return toValue;
    },
    withTiming: (toValue: number, _config: any, cb?: (finished: boolean) => void) => {
      if (cb) cb(true);
      return toValue;
    },
    runOnJS: (fn: any) => fn,
    cancelAnimation: vi.fn(),
  };
});

vi.mock('react-native-gesture-handler', () => {
  return {
    Gesture: {
      Pan: () => {
        const callbacks: any = {};
        const builder = {
          enabled: (_val: boolean) => builder,
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

describe('useKineticSwipe hook', () => {
  it('initializes in rest state at origin', () => {
    const { result } = renderHook(() => useKineticSwipe());
    expect(result.current.translation.x.value).toBe(0);
    expect(result.current.translation.y.value).toBe(0);
    expect(result.current.isDismissed).toBe(false);
    expect(result.current.isDismissedShared.value).toBe(false);
    expect(result.current.isDragging.value).toBe(false);
    expect(result.current.gesture).toBeDefined();
    expect(result.current.panHandlers).toBeDefined();
  });

  it('snaps back when gesture release is below distance threshold and escape velocity', () => {
    const onSnapBack = vi.fn();
    const onDismiss = vi.fn();

    const { result } = renderHook(() =>
      useKineticSwipe({
        threshold: 120,
        escapeVelocity: 800,
        onSnapBack,
        onDismiss,
      }),
    );

    const gesture = result.current.gesture as any;

    act(() => {
      gesture._simulateStart();
      gesture._simulateUpdate({ translationX: 50, translationY: 0 });
      gesture._simulateEnd({ velocityX: 100, velocityY: 0 });
    });

    expect(onSnapBack).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(result.current.isDismissed).toBe(false);
  });

  it('dismisses right when translation distance exceeds threshold', () => {
    const onDismissStart = vi.fn();
    const onDismiss = vi.fn();

    const { result } = renderHook(() =>
      useKineticSwipe({
        threshold: 100,
        onDismissStart,
        onDismiss,
      }),
    );

    const gesture = result.current.gesture as any;

    act(() => {
      gesture._simulateStart();
      gesture._simulateUpdate({ translationX: 150, translationY: 0 });
      gesture._simulateEnd({ velocityX: 50, velocityY: 0 });
    });

    expect(onDismissStart).toHaveBeenCalledWith('right');
    expect(onDismiss).toHaveBeenCalledWith('right');
    expect(result.current.isDismissed).toBe(true);
    expect(result.current.isDismissedShared.value).toBe(true);
  });

  it('dismisses left when release velocity exceeds escape velocity', () => {
    const onDismissStart = vi.fn();
    const onDismiss = vi.fn();

    const { result } = renderHook(() =>
      useKineticSwipe({
        threshold: 200,
        escapeVelocity: 600,
        onDismissStart,
        onDismiss,
      }),
    );

    const gesture = result.current.gesture as any;

    act(() => {
      gesture._simulateStart();
      // Small translation of 30px, but strong flick velocity of -900 px/s
      gesture._simulateUpdate({ translationX: -30, translationY: 0 });
      gesture._simulateEnd({ velocityX: -900, velocityY: 0 });
    });

    expect(onDismissStart).toHaveBeenCalledWith('left');
    expect(onDismiss).toHaveBeenCalledWith('left');
    expect(result.current.isDismissed).toBe(true);
  });

  it('supports programmatic dismiss and reset', () => {
    const onDismiss = vi.fn();

    const { result } = renderHook(() =>
      useKineticSwipe({
        onDismiss,
      }),
    );

    act(() => {
      result.current.dismiss('left');
    });

    expect(onDismiss).toHaveBeenCalledWith('left');
    expect(result.current.isDismissed).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isDismissed).toBe(false);
    expect(result.current.translation.x.value).toBe(0);
    expect(result.current.translation.y.value).toBe(0);
  });
});
