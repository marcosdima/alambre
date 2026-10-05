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
    useFrameCallback: vi.fn((cb, running) => ({ setActive: vi.fn(), isActive: running })),
    cancelAnimation: vi.fn(),
    withDelay: vi.fn((delay: number, animation: unknown) => ({ type: 'delay', delay, animation })),
    withSequence: vi.fn((...animations: unknown[]) => ({ type: 'sequence', animations })),
    withRepeat: vi.fn((animation: unknown, count: number) => ({ type: 'repeat', animation, count })),
    withTiming: vi.fn((to: number, config: { duration: number }) => ({ type: 'timing', to, config })),
    Easing: { linear: 'linear' },
  };
});

import { useFrameCallback } from 'react-native-reanimated';

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

  it('swell rises from zero to the amplitude and back, never going negative', () => {
    expect(harmonicValue('swell', 0, -6)).toBeCloseTo(0);
    expect(harmonicValue('swell', 0.25, -6)).toBeCloseTo(-3);
    expect(harmonicValue('swell', 0.5, -6)).toBeCloseTo(-6);
    expect(harmonicValue('swell', 0.75, -6)).toBeCloseTo(-3);
    expect(harmonicValue('swell', 1, -6)).toBeCloseTo(0);
    for (let p = 0; p <= 1; p += 0.1) {
      expect(harmonicValue('swell', p, 6)).toBeGreaterThanOrEqual(-1e-9);
    }
  });

  it('spin ramps linearly and restarts every cycle', () => {
    expect(harmonicValue('spin', 0, 360)).toBe(0);
    expect(harmonicValue('spin', 0.5, 360)).toBeCloseTo(180);
    expect(harmonicValue('spin', 1.5, 360)).toBeCloseTo(180);
  });

  it('wobble rests for 60% of the cycle, then bursts -1, +1, -0.5, rest', () => {
    expect(harmonicValue('wobble', 0, 10)).toBe(0);
    expect(harmonicValue('wobble', 0.5, 10)).toBe(0);
    expect(harmonicValue('wobble', 0.6, 10)).toBeCloseTo(0);
    expect(harmonicValue('wobble', 0.7, 10)).toBeCloseTo(-10);
    expect(harmonicValue('wobble', 0.8, 10)).toBeCloseTo(10);
    expect(harmonicValue('wobble', 0.9, 10)).toBeCloseTo(-5);
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
  it('starts a UI-thread loop that advances the clock', () => {
    const { result } = renderHook(() => useLoopClock({ duration: 1000 }));

    expect(result.current.isStatic).toBe(false);
    expect(useFrameCallback).toHaveBeenCalledWith(expect.any(Function), false);
    const setActive = vi.mocked(useFrameCallback).mock.results[0].value.setActive;
    expect(setActive).toHaveBeenCalledWith(true);
    expect(result.current.clock.value).toBe(0);

    const callback = vi.mocked(useFrameCallback).mock.calls[0][0];
    act(() => {
      callback({ timeSincePreviousFrame: 250 } as any);
    });
    expect(result.current.clock.value).toBeCloseTo(0.25);
  });

  it('delays the start for positive delays only', () => {
    const { result } = renderHook(() => useLoopClock({ duration: 1000, delay: 400 }));
    expect(useFrameCallback).toHaveBeenCalledWith(expect.any(Function), false);
    const setActive = vi.mocked(useFrameCallback).mock.results[0].value.setActive;
    expect(setActive).toHaveBeenCalledWith(true);
    const callback = vi.mocked(useFrameCallback).mock.calls[0][0];

    // Frame 1: 200ms elapsed (total delay elapsed: 200 < 400)
    act(() => {
      callback({ timeSincePreviousFrame: 200 } as any);
    });
    expect(result.current.clock.value).toBe(0);

    // Frame 2: 250ms elapsed (total delay elapsed: 450 >= 400, but started under threshold)
    act(() => {
      callback({ timeSincePreviousFrame: 250 } as any);
    });
    expect(result.current.clock.value).toBe(0);

    // Frame 3: delay has elapsed, clock advances
    act(() => {
      callback({ timeSincePreviousFrame: 300 } as any);
    });
    expect(result.current.clock.value).toBeCloseTo(0.3);
  });

  it('never animates under reduced motion', () => {
    mocks.reducedMotion = true;
    const { result } = renderHook(() => useLoopClock({ duration: 1000 }));

    expect(result.current.isStatic).toBe(true);
    expect(useFrameCallback).toHaveBeenCalledWith(expect.any(Function), false);
    const setActive = vi.mocked(useFrameCallback).mock.results[0].value.setActive;
    expect(setActive).toHaveBeenCalledWith(false);
    expect(result.current.clock.value).toBe(0);
  });

  it('freezes while paused and resumes when unpaused', () => {
    const { rerender } = renderHook(
      ({ paused }) => useLoopClock({ duration: 1000, paused }),
      { initialProps: { paused: true } },
    );
    expect(useFrameCallback).toHaveBeenLastCalledWith(expect.any(Function), false);
    const setActive = vi.mocked(useFrameCallback).mock.results[0].value.setActive;
    expect(setActive).toHaveBeenLastCalledWith(false);

    rerender({ paused: false });
    expect(useFrameCallback).toHaveBeenLastCalledWith(expect.any(Function), false);
    const resumeSetActive = vi.mocked(useFrameCallback).mock.results[1].value.setActive;
    expect(resumeSetActive).toHaveBeenLastCalledWith(true);
  });

  it('freezes when the app leaves the foreground and resumes on return', () => {
    renderHook(() => useLoopClock({ duration: 1000 }));
    vi.clearAllMocks();

    act(() => appState.setState('background'));
    expect(useFrameCallback).toHaveBeenLastCalledWith(expect.any(Function), false);
    const bgSetActive = vi.mocked(useFrameCallback).mock.results[0].value.setActive;
    expect(bgSetActive).toHaveBeenLastCalledWith(false);

    act(() => appState.setState('active'));
    expect(useFrameCallback).toHaveBeenLastCalledWith(expect.any(Function), false);
    const activeSetActive = vi.mocked(useFrameCallback).mock.results[1].value.setActive;
    expect(activeSetActive).toHaveBeenLastCalledWith(true);
  });

  it('ignores AppState when pauseWhenInactive is false', () => {
    renderHook(() => useLoopClock({ duration: 1000, pauseWhenInactive: false }));
    vi.clearAllMocks();

    act(() => appState.setState('background'));
    expect(useFrameCallback).toHaveBeenLastCalledWith(expect.any(Function), false);
    const setActive = vi.mocked(useFrameCallback).mock.results[0].value.setActive;
    expect(setActive).toHaveBeenLastCalledWith(true);
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
    expect(useFrameCallback).toHaveBeenCalledWith(expect.any(Function), false);
    const setActive = vi.mocked(useFrameCallback).mock.results[0].value.setActive;
    expect(setActive).toHaveBeenCalledWith(false);
  });

  it('does not start with a non-positive duration', () => {
    renderHook(() => useLoopClock({ duration: 0 }));
    expect(useFrameCallback).toHaveBeenCalledWith(expect.any(Function), false);
    const setActive = vi.mocked(useFrameCallback).mock.results[0].value.setActive;
    expect(setActive).toHaveBeenCalledWith(false);
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
    const { result } = renderHook(() => useHarmonicMotion());
    expect(useFrameCallback).toHaveBeenCalledWith(expect.any(Function), false);
    const setActive = vi.mocked(useFrameCallback).mock.results[0].value.setActive;
    expect(setActive).toHaveBeenCalledWith(true);
    expect(result.current.value).toBeCloseTo(0);

    const callback = vi.mocked(useFrameCallback).mock.calls[0][0];
    act(() => {
      callback({ timeSincePreviousFrame: 1000 } as any);
    });
    expect(result.current.value).toBeCloseTo(1);
  });

  it('applies negative delay as a starting phase offset', () => {
    const { result } = renderHook(() =>
      useHarmonicMotion({ duration: 4000, delay: -1000, amplitude: 1 }),
    );
    expect(result.current.value).toBeCloseTo(1);
  });
});
