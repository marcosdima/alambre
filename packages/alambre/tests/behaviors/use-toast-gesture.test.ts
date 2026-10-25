import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useToastGesture } from '../../src/behaviors/toast/use-toast-gesture';
import type { Toast } from '../../src/behaviors/toast/toast-types';

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
    interpolate: vi.fn((_val: number, _inR: number[], outR: number[]) => outR[0]),
    Extrapolation: { CLAMP: 'clamp' },
    Easing: {
      linear: (t: number) => t,
      out: (f: any) => f,
      in: (f: any) => f,
      cubic: (t: number) => t,
    },
  };
});

vi.mock('react-native-gesture-handler', () => {
  return {
    Gesture: {
      Pan: () => {
        const callbacks: any = {};
        const builder = {
          onUpdate: (cb: any) => { callbacks.onUpdate = cb; return builder; },
          onEnd: (cb: any) => { callbacks.onEnd = cb; return builder; },
          _simulateUpdate: (event: any) => { if (callbacks.onUpdate) callbacks.onUpdate(event); },
          _simulateEnd: (event: any) => { if (callbacks.onEnd) callbacks.onEnd(event); },
        };
        return builder;
      },
    },
  };
});

describe('useToastGesture', () => {
  const makeToast = (overrides?: Partial<Toast['data']>): Toast => ({
    data: {
      id: 'toast-1',
      duration: 3000,
      payload: 'Test message',
      ...overrides,
    },
    startedAt: new Date(),
  });

  it('computes position and offset defaults for top toast', () => {
    const dismiss = vi.fn();
    const toast = makeToast();

    const { result } = renderHook(() => useToastGesture({ toast, dismiss }));

    expect(result.current.isTop).toBe(true);
    expect(result.current.animatedOffset.value).toBe(16);
    expect(result.current.isGestureDismissed).toBe(false);
    expect(result.current.showProgressBar).toBe(true);
  });

  it('computes position and offset defaults for bottom toast', () => {
    const dismiss = vi.fn();
    const toast = makeToast({ payload: { content: 'Bottom message', position: 'bottom' } });

    const { result } = renderHook(() =>
      useToastGesture({
        toast,
        dismiss,
        bottomOffset: 32,
      }),
    );

    expect(result.current.isTop).toBe(false);
    expect(result.current.animatedOffset.value).toBe(32);
    expect(result.current.showProgressBar).toBe(true);
  });

  it('allows explicit position prop to override payload position', () => {
    const dismiss = vi.fn();
    const toast = makeToast({ payload: { content: 'Bottom payload', position: 'bottom' } });

    const { result } = renderHook(() =>
      useToastGesture({
        toast,
        dismiss,
        position: 'top',
        topOffset: 24,
      }),
    );

    expect(result.current.isTop).toBe(true);
    expect(result.current.animatedOffset.value).toBe(24);
  });

  it('hides progress bar when toast is persistent or contains actions', () => {
    const dismiss = vi.fn();
    const persistentToast = makeToast({ persistent: true });
    const actionToast = makeToast({
      actions: [{ label: 'Undo', tone: 'primary', onPress: () => {} }],
    });

    const { result: res1 } = renderHook(() =>
      useToastGesture({ toast: persistentToast, dismiss }),
    );
    expect(res1.current.showProgressBar).toBe(false);

    const { result: res2 } = renderHook(() =>
      useToastGesture({ toast: actionToast, dismiss }),
    );
    expect(res2.current.showProgressBar).toBe(false);
  });

  it('damps downward pan when isTop is true and preserves 1:1 upward translation', () => {
    const dismiss = vi.fn();
    const toast = makeToast();
    const { result } = renderHook(() => useToastGesture({ toast, dismiss }));
    const gesture = result.current.panGesture as any;

    act(() => {
      // Upward translation (negative)
      gesture._simulateUpdate({ translationX: 10, translationY: -40 });
    });
    expect(result.current.translateX.value).toBe(10);
    expect(result.current.translateY.value).toBe(-40);

    act(() => {
      // Downward translation (positive) -> damped by 0.2
      gesture._simulateUpdate({ translationX: 5, translationY: 50 });
    });
    expect(result.current.translateX.value).toBe(5);
    expect(result.current.translateY.value).toBe(10); // 50 * 0.2
  });

  it('damps upward pan when isTop is false and preserves 1:1 downward translation', () => {
    const dismiss = vi.fn();
    const toast = makeToast();
    const { result } = renderHook(() =>
      useToastGesture({ toast, dismiss, position: 'bottom' }),
    );
    const gesture = result.current.panGesture as any;

    act(() => {
      // Downward translation (positive)
      gesture._simulateUpdate({ translationX: 0, translationY: 50 });
    });
    expect(result.current.translateY.value).toBe(50);

    act(() => {
      // Upward translation (negative) -> damped by 0.2
      gesture._simulateUpdate({ translationX: 0, translationY: -50 });
    });
    expect(result.current.translateY.value).toBe(-10); // -50 * 0.2
  });

  describe('dismiss threshold calculations on gesture release (onEnd)', () => {
    it('dismisses top toast when swiped up beyond verticalThreshold', () => {
      const dismiss = vi.fn();
      const toast = makeToast();
      const { result } = renderHook(() =>
        useToastGesture({ toast, dismiss, verticalThreshold: 35 }),
      );
      const gesture = result.current.panGesture as any;

      act(() => {
        gesture._simulateEnd({ translationX: 0, translationY: -36, velocityX: 0, velocityY: 0 });
      });

      expect(dismiss).toHaveBeenCalledWith('toast-1');
      expect(result.current.isGestureDismissed).toBe(true);
    });

    it('dismisses top toast when swiped up with high escape velocity', () => {
      const dismiss = vi.fn();
      const toast = makeToast();
      const { result } = renderHook(() => useToastGesture({ toast, dismiss }));
      const gesture = result.current.panGesture as any;

      act(() => {
        gesture._simulateEnd({ translationX: 0, translationY: -10, velocityX: 0, velocityY: -400 });
      });

      expect(dismiss).toHaveBeenCalledWith('toast-1');
      expect(result.current.isGestureDismissed).toBe(true);
    });

    it('does NOT dismiss top toast when swiped downward', () => {
      const dismiss = vi.fn();
      const toast = makeToast();
      const { result } = renderHook(() => useToastGesture({ toast, dismiss }));
      const gesture = result.current.panGesture as any;

      act(() => {
        gesture._simulateEnd({ translationX: 0, translationY: 60, velocityX: 0, velocityY: 200 });
      });

      expect(dismiss).not.toHaveBeenCalled();
      expect(result.current.isGestureDismissed).toBe(false);
      expect(result.current.translateX.value).toBe(0);
      expect(result.current.translateY.value).toBe(0);
    });

    it('dismisses bottom toast when swiped down beyond verticalThreshold', () => {
      const dismiss = vi.fn();
      const toast = makeToast();
      const { result } = renderHook(() =>
        useToastGesture({ toast, dismiss, position: 'bottom', verticalThreshold: 40 }),
      );
      const gesture = result.current.panGesture as any;

      act(() => {
        gesture._simulateEnd({ translationX: 0, translationY: 41, velocityX: 0, velocityY: 0 });
      });

      expect(dismiss).toHaveBeenCalledWith('toast-1');
      expect(result.current.isGestureDismissed).toBe(true);
    });

    it('dismisses on horizontal swipe exceeding horizontalThreshold', () => {
      const dismiss = vi.fn();
      const toast = makeToast();
      const { result } = renderHook(() =>
        useToastGesture({ toast, dismiss, horizontalThreshold: 85 }),
      );
      const gesture = result.current.panGesture as any;

      act(() => {
        gesture._simulateEnd({ translationX: 90, translationY: 0, velocityX: 0, velocityY: 0 });
      });

      expect(dismiss).toHaveBeenCalledWith('toast-1');
      expect(result.current.isGestureDismissed).toBe(true);
    });

    it('dismisses on horizontal swipe with high velocity', () => {
      const dismiss = vi.fn();
      const toast = makeToast();
      const { result } = renderHook(() => useToastGesture({ toast, dismiss }));
      const gesture = result.current.panGesture as any;

      act(() => {
        gesture._simulateEnd({ translationX: 20, translationY: 0, velocityX: -700, velocityY: 0 });
      });

      expect(dismiss).toHaveBeenCalledWith('toast-1');
      expect(result.current.isGestureDismissed).toBe(true);
    });

    it('resets transforms when release is below all thresholds', () => {
      const dismiss = vi.fn();
      const toast = makeToast();
      const { result } = renderHook(() => useToastGesture({ toast, dismiss }));
      const gesture = result.current.panGesture as any;

      act(() => {
        gesture._simulateEnd({ translationX: 20, translationY: -10, velocityX: 50, velocityY: -50 });
      });

      expect(dismiss).not.toHaveBeenCalled();
      expect(result.current.isGestureDismissed).toBe(false);
      expect(result.current.translateX.value).toBe(0);
      expect(result.current.translateY.value).toBe(0);
    });
  });

  it('resets transforms and gesture dismissed state when toast id changes', () => {
    const dismiss = vi.fn();
    let currentToast = makeToast({ id: 'toast-first' });

    const { result, rerender } = renderHook(
      ({ t }) => useToastGesture({ toast: t, dismiss }),
      { initialProps: { t: currentToast } },
    );

    const gesture = result.current.panGesture as any;
    act(() => {
      gesture._simulateEnd({ translationX: 100, translationY: 0, velocityX: 0, velocityY: 0 });
    });
    expect(result.current.isGestureDismissed).toBe(true);

    // Change toast id
    currentToast = makeToast({ id: 'toast-second' });
    rerender({ t: currentToast });

    expect(result.current.isGestureDismissed).toBe(false);
    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
  });
});
