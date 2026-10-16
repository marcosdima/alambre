import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  calculateWavefrontPhase,
  criticallyDampedCurve,
  bouncyCurve,
  cubicEaseOutCurve,
  polynomialOvershootCurve,
} from '../../src/core/kinetics';
import { calculateBudgetedStaggerDelay } from '../../src/hooks/use-stagger';
import {
  useWavefront,
  WavefrontProvider,
  useWavefrontItem,
} from '../../src/hooks/use-wavefront';

vi.mock('react-native-reanimated', () => {
  return {
    useReducedMotion: vi.fn(() => false),
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withTiming: (toValue: number, _config: unknown, cb?: (finished: boolean) => void) => {
      cb?.(true);
      return toValue;
    },
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    Easing: {
      linear: (t: number) => t,
    },
  };
});

describe('Closed-form analytical kinetic curves', () => {
  it('criticallyDampedCurve settles cleanly at 1 without overshoot', () => {
    expect(criticallyDampedCurve(0)).toBe(0);
    expect(criticallyDampedCurve(0.5)).toBeGreaterThan(0.7);
    expect(criticallyDampedCurve(1)).toBe(1);
    // Boundary clamps
    expect(criticallyDampedCurve(-0.5)).toBe(0);
    expect(criticallyDampedCurve(1.5)).toBe(1);
  });

  it('bouncyCurve provides natural tactile overshoot before settling at 1', () => {
    expect(bouncyCurve(0)).toBe(0);
    // Overshoot occurs around mid-to-late progress
    let maxVal = 0;
    for (let t = 0; t <= 1; t += 0.05) {
      maxVal = Math.max(maxVal, bouncyCurve(t));
    }
    expect(maxVal).toBeGreaterThan(1.0); // Has overshoot
    expect(bouncyCurve(1)).toBe(1); // Settles at 1
  });

  it('cubicEaseOutCurve provides smooth deceleration', () => {
    expect(cubicEaseOutCurve(0)).toBe(0);
    expect(cubicEaseOutCurve(0.5)).toBe(0.875);
    expect(cubicEaseOutCurve(1)).toBe(1);
  });

  it('polynomialOvershootCurve exhibits tactile snap', () => {
    expect(polynomialOvershootCurve(0)).toBeCloseTo(0, 1);
    expect(polynomialOvershootCurve(1)).toBe(1);
  });
});

describe('calculateWavefrontPhase', () => {
  it('returns 0 when master progress is 0', () => {
    expect(calculateWavefrontPhase(0, 0, 5)).toBe(0);
    expect(calculateWavefrontPhase(0, 4, 5)).toBe(0);
  });

  it('returns 1 when master progress is 1', () => {
    expect(calculateWavefrontPhase(1, 0, 5)).toBe(1);
    expect(calculateWavefrontPhase(1, 4, 5)).toBe(1);
  });

  it('propagates earlier items before later items in the wave', () => {
    const tau = 0.5; // Halfway through the master timeline
    const phase0 = calculateWavefrontPhase(tau, 0, 10, { staggerMs: 30, itemDuration: 200 });
    const phase3 = calculateWavefrontPhase(tau, 3, 10, { staggerMs: 30, itemDuration: 200 });
    const phase8 = calculateWavefrontPhase(tau, 8, 10, { staggerMs: 30, itemDuration: 200 });

    expect(phase0).toBeGreaterThan(phase3);
    expect(phase3).toBeGreaterThanOrEqual(phase8);
  });
});

describe('calculateBudgetedStaggerDelay', () => {
  it('paces items into batches to prevent concurrent spring overload', () => {
    const opts = { initialDelay: 50, staggerMs: 40, batchSize: 3 };
    const delay0 = calculateBudgetedStaggerDelay(0, opts);
    const delay1 = calculateBudgetedStaggerDelay(1, opts);
    const delay2 = calculateBudgetedStaggerDelay(2, opts);
    const delay3 = calculateBudgetedStaggerDelay(3, opts);

    expect(delay0).toBe(50);
    expect(delay1).toBeGreaterThan(delay0);
    expect(delay2).toBeGreaterThan(delay1);
    // Item 3 starts batch 1 with an interval pause
    expect(delay3).toBeGreaterThanOrEqual(delay2);
  });

  it('returns 0 when reduced motion is enabled', () => {
    expect(calculateBudgetedStaggerDelay(5, {}, true)).toBe(0);
  });
});

describe('useWavefront hook', () => {
  it('initializes master progress and provides getItemProgress worklet', () => {
    const { result } = renderHook(() =>
      useWavefront({
        count: 5,
        staggerMs: 30,
        itemDuration: 200,
        curve: 'criticallyDamped',
      }),
    );

    expect(result.current.isReducedMotion).toBe(false);
    expect(result.current.totalDuration).toBe(4 * 30 + 200); // 320ms
    expect(typeof result.current.getItemProgress).toBe('function');
    expect(typeof result.current.getItemPhase).toBe('function');
    expect(result.current.progress).toBe(result.current.masterProgress);

    // Simulate progress change
    result.current.masterProgress.value = 1;
    expect(result.current.getItemPhase(0)).toBe(1);
    expect(result.current.getItemProgress(0)).toBe(1);
    expect(result.current.getItemProgress(4)).toBe(1);

    act(() => {
      result.current.reset();
    });
    expect(result.current.masterProgress.value).toBe(0);
    expect(result.current.progress.value).toBe(0);
  });
});

describe('useWavefrontItem hook', () => {
  it('throws a descriptive error when used outside provider without explicit wavefront', () => {
    expect(() => {
      renderHook(() => useWavefrontItem(0));
    }).toThrowError(/useWavefrontItem must be used within a <WavefrontProvider>/);
  });

  it('works with explicit wavefront instance option', () => {
    const { result: wfResult } = renderHook(() =>
      useWavefront({ count: 4, autoStart: false }),
    );
    const wavefront = wfResult.current;

    const { result: itemResult, rerender } = renderHook(() =>
      useWavefrontItem(0, { wavefront, preset: 'slide-up', distance: 30 }),
    );

    expect(itemResult.current.masterProgress).toBe(wavefront.progress);
    expect(itemResult.current.isReducedMotion).toBe(false);
    expect(typeof itemResult.current.getProgress).toBe('function');
    expect(typeof itemResult.current.getPhase).toBe('function');

    // At progress = 0
    wavefront.progress.value = 0;
    expect(itemResult.current.getProgress()).toBe(0);
    expect(itemResult.current.getPhase()).toBe(0);

    // At progress = 1 (settled)
    wavefront.progress.value = 1;
    rerender();
    expect(itemResult.current.getProgress()).toBe(1);
    expect(itemResult.current.getPhase()).toBe(1);
    expect(itemResult.current.animatedStyle).toEqual({
      opacity: 1,
      transform: [{ translateY: 0 }],
    });
  });

  it('correctly handles different built-in presets', () => {
    const { result: wfResult } = renderHook(() =>
      useWavefront({ count: 2, autoStart: false }),
    );
    const wavefront = wfResult.current;
    wavefront.progress.value = 1;

    const { result: fadeItem } = renderHook(() =>
      useWavefrontItem(0, { wavefront, preset: 'fade' }),
    );
    expect(fadeItem.current.animatedStyle).toEqual({ opacity: 1 });

    const { result: scaleItem } = renderHook(() =>
      useWavefrontItem(0, { wavefront, preset: 'scale' }),
    );
    expect(scaleItem.current.animatedStyle).toEqual({
      opacity: 1,
      transform: [{ scale: 1 }],
    });

    const { result: popItem } = renderHook(() =>
      useWavefrontItem(0, { wavefront, preset: 'pop' }),
    );
    expect(popItem.current.animatedStyle).toEqual({
      opacity: 1,
      transform: [{ scale: 1 }],
    });

    const { result: slideScaleItem } = renderHook(() =>
      useWavefrontItem(0, { wavefront, preset: 'slide-scale' }),
    );
    expect(slideScaleItem.current.animatedStyle).toEqual({
      opacity: 1,
      transform: [{ translateY: 0 }, { scale: 1 }],
    });
  });

  it('supports custom style worklet with progress and phase', () => {
    const { result: wfResult } = renderHook(() =>
      useWavefront({ count: 2, autoStart: false }),
    );
    const wavefront = wfResult.current;
    wavefront.progress.value = 1;

    const customStyle = vi.fn((p: number, phase: number) => ({
      opacity: p,
      transform: [{ rotateZ: `${(1 - p) * 45}deg` }],
      testPhase: phase,
    }));

    const { result: customItem } = renderHook(() =>
      useWavefrontItem(0, { wavefront, style: customStyle }),
    );

    expect(customStyle).toHaveBeenCalledWith(1, 1);
    expect(customItem.current.animatedStyle).toEqual({
      opacity: 1,
      transform: [{ rotateZ: '0deg' }],
      testPhase: 1,
    });
  });

  it('settles instantly to identity when forceReducedMotion is true', () => {
    const { result: wfResult } = renderHook(() =>
      useWavefront({ count: 2, autoStart: false }),
    );
    const wavefront = wfResult.current;
    wavefront.progress.value = 0; // Even with progress = 0

    const { result } = renderHook(() =>
      useWavefrontItem(0, {
        wavefront,
        preset: 'slide-up',
        forceReducedMotion: true,
      }),
    );

    expect(result.current.isReducedMotion).toBe(true);
    expect(result.current.animatedStyle).toEqual({
      opacity: 1,
      transform: [{ translateY: 0 }],
    });
  });
});

describe('WavefrontProvider', () => {
  it('propagates wavefront context down to useWavefrontItem when given options', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WavefrontProvider count={6} staggerMs={25} itemDuration={150}>
        {children}
      </WavefrontProvider>
    );

    const { result } = renderHook(() => useWavefrontItem(2), { wrapper });

    expect(result.current.wavefront).toBeDefined();
    expect(result.current.masterProgress).toBe(result.current.wavefront.progress);
    expect(result.current.isReducedMotion).toBe(false);
  });

  it('propagates an existing wavefront instance passed via value prop', () => {
    const { result: wfResult } = renderHook(() =>
      useWavefront({ count: 8, staggerMs: 20 }),
    );
    const externalWavefront = wfResult.current;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WavefrontProvider value={externalWavefront}>
        {children}
      </WavefrontProvider>
    );

    const { result } = renderHook(() => useWavefrontItem(3), { wrapper });

    expect(result.current.wavefront).toBe(externalWavefront);
    expect(result.current.masterProgress).toBe(externalWavefront.progress);
  });
});

