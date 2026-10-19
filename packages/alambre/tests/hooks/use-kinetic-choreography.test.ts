import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKineticChoreography } from '../../src/hooks/use-kinetic-choreography';

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  return {
    useReducedMotion: vi.fn(() => false),
    useSharedValue: (initial: number | string | boolean) => {
      const ref = React.useRef({ value: initial });
      return ref.current;
    },
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withTiming: (toValue: number, _config: unknown, callback?: (finished: boolean) => void) => {
      if (callback) {
        Promise.resolve().then(() => callback(true));
      }
      return toValue;
    },
    withSpring: (toValue: number, _config: unknown, callback?: (finished: boolean) => void) => {
      if (callback) {
        Promise.resolve().then(() => callback(true));
      }
      return toValue;
    },
    Easing: {
      bezier: () => (t: number) => t,
      out: (fn: (t: number) => number) => fn,
      quad: (t: number) => t,
    },
    runOnJS: (fn: (...args: unknown[]) => void) => fn,
    cancelAnimation: vi.fn(),
  };
});

describe('useKineticChoreography hook', () => {
  it('initializes with default and custom resting values', () => {
    const { result } = renderHook(() =>
      useKineticChoreography({
        initial: { x: 50, y: 100, scale: 0.9, rotateDeg: 12, opacity: 0.8 },
      }),
    );

    expect(result.current.x.value).toBe(50);
    expect(result.current.y.value).toBe(100);
    expect(result.current.scale.value).toBe(0.9);
    expect(result.current.rotateDeg.value).toBe(12);
    expect(result.current.rotateXDeg.value).toBe(0);
    expect(result.current.rotateYDeg.value).toBe(0);
    expect(result.current.opacity.value).toBe(0.8);
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.activeStepId).toBeNull();
  });

  it('updates tracks manually via updateManual on the UI thread', () => {
    const { result, rerender } = renderHook(() => useKineticChoreography());

    act(() => {
      result.current.updateManual({
        x: 35,
        y: -45,
        scale: 1.05,
        rotateDeg: 8,
      });
    });

    rerender();

    expect(result.current.x.value).toBe(35);
    expect(result.current.y.value).toBe(-45);
    expect(result.current.scale.value).toBe(1.05);
    expect(result.current.rotateDeg.value).toBe(8);

    expect(result.current.animatedStyle).toEqual({
      opacity: 1,
      transform: [
        { perspective: 1000 },
        { translateX: 35 },
        { translateY: -45 },
        { rotate: '8deg' },
        { rotateX: '0deg' },
        { rotateY: '0deg' },
        { scale: 1.05 },
      ],
    });
  });

  it('executes a single transition step with callback and updates activeStepId', async () => {
    const onStepChange = vi.fn();
    const onComplete = vi.fn();
    const onStepComplete = vi.fn();

    const { result } = renderHook(() =>
      useKineticChoreography({
        onStepChange,
        onComplete,
      }),
    );

    await act(async () => {
      result.current.transitionTo({
        id: 'flight_step',
        to: { x: 200, y: 300, scale: 1.1 },
        duration: 250,
        onStepComplete,
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(onStepChange).toHaveBeenCalledWith('flight_step', null);
    expect(onStepComplete).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
    expect(result.current.x.value).toBe(200);
    expect(result.current.y.value).toBe(300);
    expect(result.current.scale.value).toBe(1.1);
  });

  it('chains multi-step sequences sequentially', async () => {
    const stepLog: (string | number)[] = [];
    const { result } = renderHook(() =>
      useKineticChoreography({
        onStepChange: (id) => stepLog.push(id),
      }),
    );

    await act(async () => {
      result.current.sequence([
        { id: 'lift', to: { y: -50, scale: 1.08 }, driver: 'spring' },
        { id: 'rotate', to: { rotateDeg: 45 }, driver: 'timing' },
        { id: 'settle', to: { y: 0, scale: 1, rotateDeg: 0 }, driver: 'spring' },
      ]);
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(stepLog).toEqual(['lift', 'rotate', 'settle']);
    expect(result.current.y.value).toBe(0);
    expect(result.current.scale.value).toBe(1);
    expect(result.current.rotateDeg.value).toBe(0);
  });

  it('chains steps fluently using the chain() builder API', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useKineticChoreography({
        onComplete,
      }),
    );

    await act(async () => {
      result.current
        .chain()
        .to({ x: 100, y: 50 }, { id: 'step_1' })
        .then({ rotateDeg: 90 }, { id: 'step_2' })
        .then({ opacity: 0.5 }, { id: 'step_3' })
        .run();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(onComplete).toHaveBeenCalled();
    expect(result.current.x.value).toBe(100);
    expect(result.current.y.value).toBe(50);
    expect(result.current.rotateDeg.value).toBe(90);
    expect(result.current.opacity.value).toBe(0.5);
  });

  it('handles gesture release momentum handoff', async () => {
    const { result } = renderHook(() => useKineticChoreography());

    await act(async () => {
      result.current.handoffGesture(
        { vx: 1200, vy: -800 },
        { x: 300, y: -100 },
        { id: 'gesture_flick' },
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.x.value).toBe(300);
    expect(result.current.y.value).toBe(-100);
  });

  it('resets tracks to target or initial values', () => {
    const { result } = renderHook(() =>
      useKineticChoreography({
        initial: { x: 0, y: 0, scale: 1 },
      }),
    );

    act(() => {
      result.current.updateManual({ x: 99, y: 88, scale: 1.5 });
    });

    expect(result.current.x.value).toBe(99);

    act(() => {
      result.current.reset({ x: 10, y: 20 });
    });

    expect(result.current.x.value).toBe(10);
    expect(result.current.y.value).toBe(20);
    expect(result.current.scale.value).toBe(1);
    expect(result.current.isAnimating).toBe(false);
  });
});
