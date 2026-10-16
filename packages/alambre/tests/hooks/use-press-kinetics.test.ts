import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { GestureResponderEvent } from 'react-native';
import { usePressKinetics } from '../../src/hooks/use-press-kinetics';

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  return {
    useReducedMotion: vi.fn(() => false),
    useSharedValue: (initial: number) => {
      const ref = React.useRef({ value: initial });
      return ref.current;
    },
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withSpring: (toValue: number) => toValue,
  };
});

const mockEvent = {} as GestureResponderEvent;

describe('usePressKinetics hook', () => {
  it('initializes with unpressed values and correct defaults', () => {
    const { result } = renderHook(() =>
      usePressKinetics({
        activeScale: 0.95,
        activeOpacity: 0.8,
        activeTranslateY: 4,
      }),
    );

    expect(result.current.progress.value).toBe(0);
    expect(result.current.isPressed).toBe(result.current.progress);
    expect(result.current.pressed).toBe(false);
    expect(result.current.animatedStyle).toEqual({
      transform: [{ scale: 1 }, { translateY: 0 }],
      opacity: 1,
    });
    expect(typeof result.current.pressProps.onPressIn).toBe('function');
    expect(typeof result.current.pressProps.onPressOut).toBe('function');
    // Undefined handlers must NOT be present on pressProps
    expect(result.current.pressProps.onPress).toBeUndefined();
    expect(result.current.pressProps.onLongPress).toBeUndefined();
  });

  it('animates progress on press-in and press-out', () => {
    const onIn = vi.fn();
    const onOut = vi.fn();
    const haptic = vi.fn();

    const { result, rerender } = renderHook(() =>
      usePressKinetics({
        activeScale: 0.9,
        activeTranslateY: 2,
        activeOpacity: 0.9,
        onPressIn: onIn,
        onPressOut: onOut,
        hapticFeedback: haptic,
      }),
    );

    // Press in
    act(() => {
      result.current.pressProps.onPressIn(mockEvent);
    });

    expect(onIn).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledTimes(1);
    expect(result.current.progress.value).toBe(1);

    rerender();
    expect(result.current.animatedStyle).toEqual({
      transform: [{ scale: 0.9 }, { translateY: 2 }],
      opacity: 0.9,
    });

    // Press out
    act(() => {
      result.current.pressProps.onPressOut(mockEvent);
    });

    expect(onOut).toHaveBeenCalledTimes(1);
    expect(result.current.progress.value).toBe(0);

    rerender();
    expect(result.current.animatedStyle).toEqual({
      transform: [{ scale: 1 }, { translateY: 0 }],
      opacity: 1,
    });
  });

  it('forwards optional onPress and onLongPress handlers cleanly', () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();

    const { result } = renderHook(() =>
      usePressKinetics({
        onPress,
        onLongPress,
      }),
    );

    expect(result.current.pressProps.onPress).toBeDefined();
    expect(result.current.pressProps.onLongPress).toBeDefined();

    act(() => {
      result.current.pressProps.onPress!(mockEvent);
      result.current.pressProps.onLongPress!(mockEvent);
    });

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state and ignores press events', () => {
    const onIn = vi.fn();
    const onPress = vi.fn();

    const { result } = renderHook(() =>
      usePressKinetics({
        disabled: true,
        onPressIn: onIn,
        onPress,
      }),
    );

    expect(result.current.pressProps.disabled).toBe(true);

    act(() => {
      result.current.pressProps.onPressIn(mockEvent);
      result.current.pressProps.onPress!(mockEvent);
    });

    expect(onIn).not.toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
    expect(result.current.progress.value).toBe(0);
  });

  it('synchronizes and springs back to 0 if disabled becomes true while pressed', () => {
    let disabled = false;
    const { result, rerender } = renderHook(() =>
      usePressKinetics({ disabled }),
    );

    // Press down
    act(() => {
      result.current.pressProps.onPressIn(mockEvent);
    });
    expect(result.current.progress.value).toBe(1);

    // Component becomes disabled while held down (e.g. form submission starts)
    disabled = true;
    rerender();

    expect(result.current.progress.value).toBe(0);
  });

  it('supports opt-in trackState for React boolean synchronization', () => {
    const { result } = renderHook(() =>
      usePressKinetics({ trackState: true }),
    );

    expect(result.current.pressed).toBe(false);

    act(() => {
      result.current.pressProps.onPressIn(mockEvent);
    });
    expect(result.current.pressed).toBe(true);

    act(() => {
      result.current.pressProps.onPressOut(mockEvent);
    });
    expect(result.current.pressed).toBe(false);
  });
});
