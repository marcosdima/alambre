import { act, renderHook } from '@testing-library/react';
import type * as ReactNative from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { harmonicValue, useHarmonicMotion } from '../../src/hooks/use-harmonic-motion';
import { phaseOffset, useLoopClock, wrapPhase } from '../../src/hooks/use-loop-clock';

const mocks = vi.hoisted(() => {
  const listeners = new Set<(state: string) => void>();
  return {
    reducedMotion: false,
    appState: {
      currentState: 'active',
      addEventListener: (_event: string, listener: (state: string) => void) => {
        listeners.add(listener);
        return { remove: () => listeners.delete(listener) };
      },
      setState(state: string) {
        this.currentState = state;
        listeners.forEach((listener) => listener(state));
      },
      listenerCount: () => listeners.size,
    },
  };
});

vi.mock('react-native', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactNative>()),
  AppState: mocks.appState,
}));

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  return {
    useReducedMotion: () => mocks.reducedMotion,
    useSharedValue: (initial: number) => {
    // Stable box per hook call site, like the real implementation.
      const ref = React.useRef<{ value: number } | null>(null);
      if (!ref.current) ref.current = { value: initial };
      return ref.current;
    },
    useDerivedValue: (fn: () => number) => ({
      get value() {
        return fn();
      },
    }),
    cancelAnimation: vi.fn(),
    withDelay: vi.fn((delay: number, animation: unknown) => ({ type: 'delay', delay, animation })),
    withSequence: vi.fn((...animations: unknown[]) => ({ type: 'sequence', animations })),
    withRepeat: vi.fn((animation: unknown, count: number) => ({ type: 'repeat', animation, count })),
    withTiming: vi.fn((to: number, config: { duration: number }) => ({ type: 'timing', to, config })),
    Easing: { linear: 'linear' },
  };
});

import { cancelAnimation, withTiming } from 'react-native-reanimated';

const appState = mocks.appState;

beforeEach(() => {
  mocks.reducedMotion = false;
  appState.currentState = 'active';
  vi.clearAllMocks();
});

describe('wrapPhase / phaseOffset', () => {
  it('wraps any number into [0, 1)', () => {
    expect(wrapPhase(0)).toBe(0);
    expect(wrapPhase(1)).toBe(0);
    expect(wrapPhase(1.25)).toBeCloseTo(0.25);
    expect(wrapPhase(-0.25)).toBeCloseTo(0.75);
  });

  it('only negative delays create a phase offset', () => {
    expect(phaseOffset(500, 1000)).toBe(0);
    expect(phaseOffset(0, 1000)).toBe(0);
    expect(phaseOffset(-250, 1000)).toBeCloseTo(0.25);
    expect(phaseOffset(-1250, 1000)).toBeCloseTo(0.25);
    expect(phaseOffset(-100, 0)).toBe(0);
  });
});

describe('harmonicValue profiles', () => {
  it('sine oscillates symmetrically around zero', () => {
    expect(harmonicValue('sine', 0, 6)).toBeCloseTo(0);
    expect(harmonicValue('sine', 0.25, 6)).toBeCloseTo(6);
    expect(harmonicValue('sine', 0.5, 6)).toBeCloseTo(0);
    expect(harmonicValue('sine', 0.75, 6)).toBeCloseTo(-6);
  });

  it('spin ramps linearly and restarts every cycle', () => {
    expect(harmonicValue('spin', 0, 360)).toBe(0);
    expect(harmonicValue('spin', 0.5, 360)).toBeCloseTo(180);
    expect(harmonicValue('spin', 1.5, 360)).toBeCloseTo(180);
  });

  it('wobble rests for 88% of the cycle, then bursts -1, +1, -0.5, rest', () => {
    expect(harmonicValue('wobble', 0, 10)).toBe(0);
    expect(harmonicValue('wobble', 0.5, 10)).toBe(0);
    expect(harmonicValue('wobble', 0.88, 10)).toBeCloseTo(0);
    expect(harmonicValue('wobble', 0.91, 10)).toBeCloseTo(-10);
    expect(harmonicValue('wobble', 0.94, 10)).toBeCloseTo(10);
    expect(harmonicValue('wobble', 0.97, 10)).toBeCloseTo(-5);
    expect(harmonicValue('wobble', 1, 10)).toBeCloseTo(0);
  });

  it('beat reproduces the 1 → 1.18 → 0.96 → 1.08 → 1 heartbeat scale', () => {
    const scale = (phase: number) => 1 + harmonicValue('beat', phase, 0.18);
    expect(scale(0)).toBeCloseTo(1);
    expect(scale(0.15)).toBeCloseTo(1.18);
    expect(scale(0.3)).toBeCloseTo(0.96);
    expect(scale(0.45)).toBeCloseTo(1.08);
    expect(scale(0.6)).toBeCloseTo(1);
    expect(scale(0.9)).toBeCloseTo(1);
  });

  it('interpolates linearly between keyframes', () => {
    expect(harmonicValue('beat', 0.075, 1)).toBeCloseTo(0.5);
  });
});

describe('useLoopClock', () => {
  it('starts a UI-thread loop that finishes the current cycle then repeats', () => {
    const { result } = renderHook(() => useLoopClock({ duration: 1000 }));

    expect(result.current.isStatic).toBe(false);
    expect(withTiming).toHaveBeenCalledWith(1, { duration: 1000, easing: 'linear' });
    expect(cancelAnimation).not.toHaveBeenCalled();
    expect(result.current.clock.value).toMatchObject({ type: 'delay', delay: 0 });
  });

  it('delays the start for positive delays only', () => {
    const { result } = renderHook(() => useLoopClock({ duration: 1000, delay: 400 }));
    expect(result.current.clock.value).toMatchObject({ type: 'delay', delay: 400 });
  });

  it('never animates under reduced motion', () => {
    mocks.reducedMotion = true;
    const { result } = renderHook(() => useLoopClock({ duration: 1000 }));

    expect(result.current.isStatic).toBe(true);
    expect(withTiming).not.toHaveBeenCalled();
    expect(result.current.clock.value).toBe(0);
  });

  it('freezes while paused and resumes when unpaused', () => {
    const { rerender } = renderHook(
      ({ paused }) => useLoopClock({ duration: 1000, paused }),
      { initialProps: { paused: true } },
    );
    expect(withTiming).not.toHaveBeenCalled();
    expect(cancelAnimation).toHaveBeenCalled();

    rerender({ paused: false });
    expect(withTiming).toHaveBeenCalled();
  });

  it('freezes when the app leaves the foreground and resumes on return', () => {
    renderHook(() => useLoopClock({ duration: 1000 }));
    vi.clearAllMocks();

    act(() => appState.setState('background'));
    expect(cancelAnimation).toHaveBeenCalled();
    expect(withTiming).not.toHaveBeenCalled();

    act(() => appState.setState('active'));
    expect(withTiming).toHaveBeenCalled();
  });

  it('ignores AppState when pauseWhenInactive is false', () => {
    renderHook(() => useLoopClock({ duration: 1000, pauseWhenInactive: false }));
    vi.clearAllMocks();

    act(() => appState.setState('background'));
    expect(cancelAnimation).not.toHaveBeenCalled();
  });

  it('removes its AppState subscription on unmount', () => {
    const { unmount } = renderHook(() => useLoopClock({ duration: 1000 }));
    expect(appState.listenerCount()).toBe(1);
    unmount();
    expect(appState.listenerCount()).toBe(0);
  });

  it('starts frozen when mounted while the app is backgrounded', () => {
    appState.currentState = 'background';
    renderHook(() => useLoopClock({ duration: 1000 }));
    expect(withTiming).not.toHaveBeenCalled();
  });

  it('does not start with a non-positive duration', () => {
    renderHook(() => useLoopClock({ duration: 0 }));
    expect(withTiming).not.toHaveBeenCalled();
  });

  it('cancels the loop on unmount', () => {
    const { unmount } = renderHook(() => useLoopClock({ duration: 1000 }));
    vi.clearAllMocks();
    unmount();
    expect(cancelAnimation).toHaveBeenCalled();
  });
});

describe('useHarmonicMotion', () => {
  it('holds the rest pose under reduced motion', () => {
    mocks.reducedMotion = true;
    const swing = renderHook(() => useHarmonicMotion({ profile: 'sine', amplitude: 8 }));
    const beat = renderHook(() => useHarmonicMotion({ profile: 'beat', amplitude: 0.18 }));
    expect(swing.result.current.value).toBeCloseTo(0);
    expect(beat.result.current.value).toBeCloseTo(0);
  });

  it('uses documented defaults without options', () => {
    expect(() => renderHook(() => useHarmonicMotion())).not.toThrow();
    expect(withTiming).toHaveBeenCalledWith(1, { duration: 4000, easing: 'linear' });
  });
});
