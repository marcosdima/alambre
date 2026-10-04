import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as UseLoopClock from '../../src/hooks/use-loop-clock';
import { useHarmonicMotion } from '../../src/hooks/use-harmonic-motion';

const mocks = vi.hoisted(() => ({
  clock: { value: 0 },
  isStatic: false,
}));

vi.mock('../../src/hooks/use-loop-clock', async (importOriginal) => ({
  ...(await importOriginal<typeof UseLoopClock>()),
  useLoopClock: () => ({ clock: mocks.clock, isStatic: mocks.isStatic }),
}));

vi.mock('react-native-reanimated', () => ({
  useDerivedValue: (fn: () => number) => ({
    get value() {
      return fn();
    },
  }),
}));

beforeEach(() => {
  mocks.clock.value = 0;
  mocks.isStatic = false;
});

describe('useHarmonicMotion clock mapping', () => {
  it('follows the clock through the sine profile', () => {
    const { result } = renderHook(() => useHarmonicMotion({ profile: 'sine', amplitude: 6, duration: 1000 }));

    mocks.clock.value = 0;
    expect(result.current.value).toBeCloseTo(0);
    mocks.clock.value = 0.25;
    expect(result.current.value).toBeCloseTo(6);
    mocks.clock.value = 0.75;
    expect(result.current.value).toBeCloseTo(-6);
  });

  it('starts mid-cycle for a negative delay, without waiting', () => {
    const { result } = renderHook(() =>
      useHarmonicMotion({ profile: 'sine', amplitude: 6, duration: 1000, delay: -250 }),
    );
    mocks.clock.value = 0;
    expect(result.current.value).toBeCloseTo(6);
  });

  it('desynchronises siblings that share a duration but differ in delay', () => {
    const a = renderHook(() => useHarmonicMotion({ profile: 'spin', amplitude: 360, duration: 1000, delay: 0 }));
    const b = renderHook(() => useHarmonicMotion({ profile: 'spin', amplitude: 360, duration: 1000, delay: -500 }));
    mocks.clock.value = 0.1;
    expect(a.result.current.value).toBeCloseTo(36);
    expect(b.result.current.value).toBeCloseTo(216);
  });

  it('stays at the rest pose when static, whatever the clock says', () => {
    mocks.isStatic = true;
    const { result } = renderHook(() => useHarmonicMotion({ profile: 'sine', amplitude: 6 }));
    mocks.clock.value = 0.25;
    expect(result.current.value).toBeCloseTo(0);
  });

  it('wraps the clock plus offset past one full cycle', () => {
    const { result } = renderHook(() =>
      useHarmonicMotion({ profile: 'spin', amplitude: 360, duration: 1000, delay: -750 }),
    );
    mocks.clock.value = 0.5;
    expect(result.current.value).toBeCloseTo(90);
  });
});
