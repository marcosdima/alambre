import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKineticPipeline } from '../../src/hooks/use-kinetic-pipeline';

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  return {
    useReducedMotion: vi.fn(() => false),
    useSharedValue: (initial: number | string) => {
      const ref = React.useRef({ value: initial });
      return ref.current;
    },
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withTiming: (toValue: number, _config: unknown, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
    withSpring: (toValue: number, _config: unknown, callback?: (finished: boolean) => void) => {
      callback?.(true);
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

describe('useKineticPipeline hook', () => {
  it('initializes with default stage and shared values', () => {
    const { result } = renderHook(() =>
      useKineticPipeline({
        initialStage: 'idle',
        initialContext: { cardId: 'ace_spades' },
      }),
    );

    expect(result.current.stage).toBe('idle');
    expect(result.current.stageShared.value).toBe('idle');
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.context).toEqual({ cardId: 'ace_spades' });
    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
    expect(result.current.rotateDeg.value).toBe(0);
    expect(result.current.scale.value).toBe(1);
    expect(result.current.opacity.value).toBe(1);
    expect(result.current.progress.value).toBe(0);
    expect(result.current.queueLength).toBe(0);
  });

  it('updates position and reflects in animatedStyle during drag', () => {
    const { result, rerender } = renderHook(() => useKineticPipeline());

    act(() => {
      result.current.updatePosition(40, -80, 15, 1.05);
    });

    rerender();

    expect(result.current.translateX.value).toBe(40);
    expect(result.current.translateY.value).toBe(-80);
    expect(result.current.rotateDeg.value).toBe(15);
    expect(result.current.scale.value).toBe(1.05);

    expect(result.current.animatedStyle).toEqual({
      transform: [
        { translateX: 40 },
        { translateY: -80 },
        { rotate: '15deg' },
        { scale: 1.05 },
      ],
      opacity: 1,
    });
  });

  it('transitions through stages explicitly with transitionTo', () => {
    const onStageChange = vi.fn();
    const { result } = renderHook(() =>
      useKineticPipeline({
        onStageChange,
      }),
    );

    act(() => {
      result.current.transitionTo('drag');
    });

    expect(result.current.stage).toBe('drag');
    expect(result.current.stageShared.value).toBe('drag');
    expect(onStageChange).toHaveBeenCalledWith('drag', 'idle', undefined);
  });

  it('handles ballistic flight transition and settling callbacks', () => {
    const onStageChange = vi.fn();
    const onComplete = vi.fn();
    const onLanding = vi.fn();
    const onSettled = vi.fn();

    const { result } = renderHook(() =>
      useKineticPipeline({
        onStageChange,
        onComplete,
        initialContext: { test: 123 },
      }),
    );

    act(() => {
      // First drag
      result.current.updatePosition(20, 30, 5);
      // Then release into flight
      result.current.transitionToFlight({
        to: { x: 200, y: 350 },
        targetRotation: -10,
        initialVelocity: { vx: 300, vy: -500 },
        onLanding,
        onSettled,
      });
    });

    expect(onLanding).toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledWith({ test: 123 });
    expect(result.current.stage).toBe('settled');
    expect(result.current.translateX.value).toBe(200);
    expect(result.current.translateY.value).toBe(350);
    expect(result.current.rotateDeg.value).toBe(-10);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('resets to idle and origin coordinates', () => {
    const { result } = renderHook(() => useKineticPipeline());

    act(() => {
      result.current.updatePosition(150, 200, 45, 1.2);
      result.current.transitionTo('drag');
    });

    expect(result.current.stage).toBe('drag');

    act(() => {
      result.current.reset({ x: 0, y: 0, rotation: 0, scale: 1 });
    });

    expect(result.current.stage).toBe('idle');
    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
    expect(result.current.rotateDeg.value).toBe(0);
    expect(result.current.scale.value).toBe(1);
    expect(result.current.progress.value).toBe(0);
  });

  it('manages queue execution and clearing', () => {
    const { result } = renderHook(() => useKineticPipeline());

    act(() => {
      result.current.enqueue({
        options: { to: { x: 50, y: 50 } },
      });
    });

    // Since mock synchronously finishes flight, stage becomes settled
    expect(result.current.stage).toBe('settled');
    expect(result.current.translateX.value).toBe(50);
    expect(result.current.translateY.value).toBe(50);

    act(() => {
      result.current.enqueueBatch([
        { options: { to: { x: 100, y: 100 } } },
        { options: { to: { x: 200, y: 200 } } },
      ]);
    });

    expect(result.current.clearQueue).toBeDefined();
    act(() => {
      result.current.clearQueue();
    });
    expect(result.current.queueLength).toBe(0);
  });

  it('snaps instantly when forceReducedMotion is enabled', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useKineticPipeline({
        forceReducedMotion: true,
        onComplete,
        initialContext: { card: 'king' },
      }),
    );

    act(() => {
      result.current.transitionToFlight({
        to: { x: 120, y: 240 },
        targetRotation: 0,
      });
    });

    expect(result.current.stage).toBe('settled');
    expect(result.current.translateX.value).toBe(120);
    expect(result.current.translateY.value).toBe(240);
    expect(result.current.progress.value).toBe(1);
    expect(onComplete).toHaveBeenCalledWith({ card: 'king' });
  });
});
