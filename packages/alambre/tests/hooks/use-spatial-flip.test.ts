import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpatialFlip } from '../../src/hooks/use-spatial-flip';

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  return {
    useReducedMotion: vi.fn(() => false),
    useSharedValue: (initial: number) => {
      const ref = React.useRef({ value: initial });
      return ref.current;
    },
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withSpring: (toValue: number, _config: unknown, callback?: (finished: boolean) => void) => {
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
    Extrapolation: { CLAMP: 'clamp' },
    runOnJS: (fn: (...args: unknown[]) => void) => fn,
    cancelAnimation: vi.fn(),
  };
});

describe('useSpatialFlip hook', () => {
  it('initializes with default front-facing transforms', () => {
    const { result } = renderHook(() =>
      useSpatialFlip({
        liftHeight: 22,
        peakScale: 1.08,
      }),
    );

    expect(result.current.isFlipped).toBe(false);
    expect(result.current.progress.value).toBe(0);

    // Front face faces camera at 0deg
    expect(result.current.frontAnimatedStyle).toEqual({
      transform: [{ perspective: 1000 }, { rotateY: '0deg' }],
      opacity: 1,
      zIndex: 2,
      backfaceVisibility: 'hidden',
    });

    // Back face points away at 180deg
    expect(result.current.backAnimatedStyle).toEqual({
      transform: [{ perspective: 1000 }, { rotateY: '180deg' }],
      opacity: 0,
      zIndex: 1,
      backfaceVisibility: 'hidden',
    });

    // Container at rest
    expect(result.current.containerAnimatedStyle).toEqual({
      transform: [{ translateY: 0 }, { scale: 1 }],
    });
  });

  it('flips to back face when flip() is called in uncontrolled mode', () => {
    const onFlip = vi.fn();
    const onFlipComplete = vi.fn();

    const { result, rerender } = renderHook(() =>
      useSpatialFlip({
        onFlip,
        onFlipComplete,
      }),
    );

    act(() => {
      result.current.flip();
    });

    expect(onFlip).toHaveBeenCalledWith(true);
    expect(result.current.isFlipped).toBe(true);
    expect(result.current.progress.value).toBe(1);

    rerender();

    // Front face flipped away at 180deg
    expect(result.current.frontAnimatedStyle).toEqual({
      transform: [{ perspective: 1000 }, { rotateY: '180deg' }],
      opacity: 0,
      zIndex: 1,
      backfaceVisibility: 'hidden',
    });

    // Back face faces camera at 360deg
    expect(result.current.backAnimatedStyle).toEqual({
      transform: [{ perspective: 1000 }, { rotateY: '360deg' }],
      opacity: 1,
      zIndex: 2,
      backfaceVisibility: 'hidden',
    });
  });

  it('supports vertical flip direction (rotateX)', () => {
    const { result } = renderHook(() =>
      useSpatialFlip({
        direction: 'vertical',
      }),
    );

    expect(result.current.frontAnimatedStyle).toEqual({
      transform: [{ perspective: 1000 }, { rotateX: '0deg' }],
      opacity: 1,
      zIndex: 2,
      backfaceVisibility: 'hidden',
    });
  });

  it('calculates parabolic lift and peak scale at midpoint', () => {
    const { result, rerender } = renderHook(() =>
      useSpatialFlip({
        liftHeight: 30,
        peakScale: 1.12,
      }),
    );

    // Manually set progress to midpoint
    result.current.progress.value = 0.5;
    rerender();

    expect(result.current.containerAnimatedStyle).toEqual({
      transform: [{ translateY: -30 }, { scale: 1.12 }],
    });
  });

  it('operates in controlled mode when flipped prop is supplied', () => {
    let flipped = false;
    const { result, rerender } = renderHook(() =>
      useSpatialFlip({
        flipped,
      }),
    );

    expect(result.current.isFlipped).toBe(false);
    expect(result.current.progress.value).toBe(0);

    flipped = true;
    rerender();

    expect(result.current.isFlipped).toBe(true);
    expect(result.current.progress.value).toBe(1);
  });
});
