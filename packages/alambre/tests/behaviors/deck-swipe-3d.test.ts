import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeckSwipe3D } from '../../src/behaviors/cards/useDeckSwipe3D';

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
    interpolate: vi.fn((val: number) => val),
    Extrapolation: { CLAMP: 'clamp' },
    Easing: {
      bezier: () => (t: number) => t,
      out: (fn: any) => fn,
      in: (fn: any) => fn,
      quad: (t: number) => t,
    },
    cancelAnimation: vi.fn(),
  };
});

vi.mock('react-native-gesture-handler', () => {
  return {
    Gesture: {
      Pan: () => {
        const callbacks: any = {};
        const builder = {
          onStart: (cb: any) => {
            callbacks.onStart = cb;
            return builder;
          },
          onUpdate: (cb: any) => {
            callbacks.onUpdate = cb;
            return builder;
          },
          onEnd: (cb: any) => {
            callbacks.onEnd = cb;
            return builder;
          },
        };
        return builder;
      },
    },
  };
});

describe('useDeckSwipe3D behavior', () => {
  const STORIES = [
    { id: 's1', title: 'Card 1' },
    { id: 's2', title: 'Card 2' },
    { id: 's3', title: 'Card 3' },
  ];

  it('initializes with top, second, and third cards', () => {
    const { result } = renderHook(() =>
      useDeckSwipe3D({
        initialCards: STORIES,
      }),
    );

    expect(result.current.cards).toHaveLength(3);
    expect(result.current.topCard?.id).toBe('s1');
    expect(result.current.secondCard?.id).toBe('s2');
    expect(result.current.thirdCard?.id).toBe('s3');
    expect(result.current.history).toHaveLength(0);
    expect(result.current.isDismissing).toBe(false);
  });

  it('dismisses top card to the right and calls onDismiss', () => {
    const onDismiss = vi.fn();
    const { result } = renderHook(() =>
      useDeckSwipe3D({
        initialCards: STORIES,
        onDismiss,
      }),
    );

    act(() => {
      result.current.triggerDismiss('right');
    });

    expect(onDismiss).toHaveBeenCalledWith('right', { id: 's1', title: 'Card 1' });
    expect(result.current.topCard?.id).toBe('s2');
    expect(result.current.secondCard?.id).toBe('s3');
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].id).toBe('s1');
  });

  it('restores previous card on undo', () => {
    const { result } = renderHook(() =>
      useDeckSwipe3D({
        initialCards: STORIES,
      }),
    );

    act(() => {
      result.current.triggerDismiss('left');
    });

    expect(result.current.topCard?.id).toBe('s2');

    act(() => {
      result.current.undo();
    });

    expect(result.current.topCard?.id).toBe('s1');
    expect(result.current.history).toHaveLength(0);
  });

  it('resets deck back to initial cards', () => {
    const { result } = renderHook(() =>
      useDeckSwipe3D({
        initialCards: STORIES,
      }),
    );

    act(() => {
      result.current.triggerDismiss('right');
    });
    act(() => {
      result.current.triggerDismiss('left');
    });

    expect(result.current.cards).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.cards).toHaveLength(3);
    expect(result.current.topCard?.id).toBe('s1');
    expect(result.current.history).toHaveLength(0);
  });
});
