import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rippleSample, useRipplePulse } from '../../src/hooks/use-ripple-pulse';

const mocks = vi.hoisted(() => ({
  reducedMotion: false,
}));

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  return {
    useReducedMotion: () => mocks.reducedMotion,
    useSharedValue: (initial: number) => {
      const ref = React.useRef<{ value: number } | null>(null);
      if (!ref.current) ref.current = { value: initial };
      return ref.current;
    },
    useFrameCallback: vi.fn((cb, running) => ({ setActive: vi.fn(), isActive: running })),
    cancelAnimation: vi.fn(),
    withDelay: vi.fn(() => 0),
    withSequence: vi.fn(() => 0),
    withRepeat: vi.fn(() => 0),
    withTiming: vi.fn(() => 0),
    Easing: { linear: 'linear' },
  };
});

const defaults = { minScale: 0.85, maxScale: 1.45, minOpacity: 0, maxOpacity: 0.55 };

beforeEach(() => {
  mocks.reducedMotion = false;
});

describe('rippleSample', () => {
  it('starts at minScale / maxOpacity', () => {
    const start = rippleSample(0, defaults);
    expect(start.scale).toBeCloseTo(0.85);
    expect(start.opacity).toBeCloseTo(0.55);
  });

  it('ends near maxScale / minOpacity', () => {
    const end = rippleSample(0.999, defaults);
    expect(end.scale).toBeCloseTo(1.45, 1);
    expect(end.opacity).toBeCloseTo(0, 1);
  });

  it('eases out: most of the expansion happens early', () => {
    const quarter = rippleSample(0.25, defaults);
    const progress = (quarter.scale - 0.85) / (1.45 - 0.85);
    expect(progress).toBeGreaterThan(0.7);
  });

  it('is monotonic within a wave', () => {
    let previous = rippleSample(0, defaults);
    for (let p = 0.05; p < 1; p += 0.05) {
      const current = rippleSample(p, defaults);
      expect(current.scale).toBeGreaterThanOrEqual(previous.scale);
      expect(current.opacity).toBeLessThanOrEqual(previous.opacity);
      previous = current;
    }
  });
});

describe('useRipplePulse', () => {
  it('defaults to two waves and floors invalid counts to at least one', () => {
    expect(renderHook(() => useRipplePulse()).result.current.count).toBe(2);
    expect(renderHook(() => useRipplePulse({ waves: 0 })).result.current.count).toBe(1);
    expect(renderHook(() => useRipplePulse({ waves: 3.9 })).result.current.count).toBe(3);
  });

  it('offsets waves evenly within one cycle', () => {
    const { result } = renderHook(() => useRipplePulse({ waves: 2 }));
    // Clock rests at 0: wave 0 is at the start, wave 1 is half a cycle ahead.
    const first = result.current.wave(0);
    const second = result.current.wave(1);
    expect(first.scale).toBeCloseTo(0.85);
    expect(second.scale).toBeGreaterThan(first.scale);
    expect(second.opacity).toBeLessThan(first.opacity);
  });

  it('keeps waves invisible under reduced motion', () => {
    mocks.reducedMotion = true;
    const { result } = renderHook(() => useRipplePulse({ waves: 2 }));
    expect(result.current.wave(0).opacity).toBe(0);
    expect(result.current.wave(1).opacity).toBe(0);
  });
});
