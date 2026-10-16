import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlightTrajectory } from '../../src/hooks/use-flight-trajectory';

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  return {
    useReducedMotion: vi.fn(() => false),
    useSharedValue: (initial: number) => {
      const ref = React.useRef({ value: initial });
      return ref.current;
    },
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withTiming: (toValue: number, _config: unknown, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
    interpolate: (value: number, input: number[], output: number[]) => {
      if (input.length === 2) {
        const [inMin, inMax] = input;
        const [outMin, outMax] = output;
        const ratio = (value - inMin) / (inMax - inMin);
        return outMin + ratio * (outMax - outMin);
      }
      if (input.length === 3) {
        const [in0, in1, in2] = input;
        const [out0, out1, out2] = output;
        if (value <= in1) {
          const ratio = (value - in0) / (in1 - in0);
          return out0 + ratio * (out1 - out0);
        }
        const ratio = (value - in1) / (in2 - in1);
        return out1 + ratio * (out2 - out1);
      }
      return value;
    },
    Easing: {
      bezier: () => (t: number) => t,
    },
    Extrapolation: { CLAMP: 'clamp' },
    runOnJS: (fn: (...args: unknown[]) => void) => fn,
    cancelAnimation: vi.fn(),
  };
});

describe('useFlightTrajectory hook', () => {
  it('initializes at starting point when autoStart is false', () => {
    const { result } = renderHook(() =>
      useFlightTrajectory({
        from: { x: 10, y: 20 },
        to: { x: 100, y: 200 },
        fromRotation: 0,
        targetRotation: 45,
        startScale: 0.8,
        peakScale: 1.2,
        endScale: 1.0,
        liftHeight: 50,
        autoStart: false,
      }),
    );

    expect(result.current.progress.value).toBe(0);
    expect(result.current.isFlying).toBe(false);
    expect(result.current.animatedStyle).toEqual({
      transform: [
        { perspective: 1000 },
        { translateX: 10 },
        { translateY: 20 },
        { rotate: '0deg' },
        { scale: 0.8 },
      ],
      zIndex: 9999,
    });
  });

  it('calculates parabolic altitude lift and peak scale at flight midpoint', () => {
    const { result, rerender } = renderHook(() =>
      useFlightTrajectory({
        from: { x: 0, y: 100 },
        to: { x: 200, y: 100 },
        startScale: 1.0,
        peakScale: 1.25,
        endScale: 1.0,
        liftHeight: 60,
        autoStart: false,
      }),
    );

    result.current.progress.value = 0.5;
    rerender();

    // At progress = 0.5: curX = 100, curY = 100 - (1.0 * 60) = 40, scale = 1.25
    expect(result.current.animatedStyle).toEqual({
      transform: [
        { perspective: 1000 },
        { translateX: 100 },
        { translateY: 40 },
        { rotate: '0deg' },
        { scale: 1.25 },
      ],
      zIndex: 9999,
    });
  });

  it('triggers onComplete when flight arrives at destination', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useFlightTrajectory({
        from: { x: 0, y: 0 },
        to: { x: 150, y: 300 },
        targetRotation: 90,
        onComplete,
        autoStart: false,
      }),
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.progress.value).toBe(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('supports runtime coordinate overrides on start()', () => {
    const { result, rerender } = renderHook(() =>
      useFlightTrajectory({
        from: { x: 0, y: 0 },
        to: { x: 100, y: 100 },
        autoStart: false,
      }),
    );

    act(() => {
      result.current.start({
        from: { x: 50, y: 50 },
        to: { x: 300, y: 400 },
      });
    });

    rerender();
    expect(result.current.progress.value).toBe(1);
    // At progress = 1 with overrides: curX = 300, curY = 400
    const styleObj = result.current.animatedStyle as unknown as { transform: Array<Record<string, number>> };
    expect(styleObj.transform[1]).toEqual({ translateX: 300 });
    expect(styleObj.transform[2]).toEqual({ translateY: 400 });
  });

  it('generates 3D face flip styles when flipOnFly is enabled', () => {
    const { result, rerender } = renderHook(() =>
      useFlightTrajectory({
        from: { x: 0, y: 0 },
        to: { x: 100, y: 100 },
        flipOnFly: true,
        autoStart: false,
      }),
    );

    // Initial (progress 0: card starts face-down in deck)
    const initialFront = result.current.frontAnimatedStyle as unknown as { opacity: number; zIndex: number };
    const initialBack = result.current.backAnimatedStyle as unknown as { opacity: number; zIndex: number };
    expect(initialFront.opacity).toBe(0);
    expect(initialFront.zIndex).toBe(1);
    expect(initialBack.opacity).toBe(1);
    expect(initialBack.zIndex).toBe(2);

    // Arrived (progress 1: card lands face-up in hand)
    result.current.progress.value = 1;
    rerender();

    const arrivedFront = result.current.frontAnimatedStyle as unknown as { opacity: number; zIndex: number };
    const arrivedBack = result.current.backAnimatedStyle as unknown as { opacity: number; zIndex: number };
    expect(arrivedFront.opacity).toBe(1);
    expect(arrivedFront.zIndex).toBe(2);
    expect(arrivedBack.opacity).toBe(0);
    expect(arrivedBack.zIndex).toBe(1);
  });
});
