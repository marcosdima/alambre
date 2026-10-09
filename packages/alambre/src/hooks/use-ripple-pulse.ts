import { useCallback, useMemo } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { phaseOffset, useLoopClock, wrapPhase } from './use-loop-clock';

export interface RipplePulseOptions {
  /** Scale at the start of a wave. @default 0.85 */
  minScale?: number;
  /** Scale at the end of a wave. @default 1.45 */
  maxScale?: number;
  /** Opacity at the end of a wave. @default 0 */
  minOpacity?: number;
  /** Opacity at the start of a wave. @default 0.55 */
  maxOpacity?: number;
  /** Length of one wave in milliseconds. @default 2800 */
  duration?: number;
  /** Number of concentric waves, evenly offset within one cycle. @default 2 */
  waves?: number;
  /** Milliseconds; same semantics as `useHarmonicMotion`. @default 0 */
  delay?: number;
  /** Freezes the pulse. @default false */
  paused?: boolean;
  /** Freezes the pulse while the app is backgrounded. @default true */
  pauseWhenInactive?: boolean;
}

export interface RippleWave {
  scale: number;
  opacity: number;
}

export interface UseRipplePulseReturn {
  /** Number of waves, so callers can render `Array.from({ length: count })`. */
  count: number;
  /**
   * Worklet returning the current `{ scale, opacity }` of wave `index`
   * (`0 <= index < count`). Call it inside `useAnimatedStyle` / `useAnimatedProps`.
   * Under reduced motion every wave is fully transparent.
   */
  wave: (index: number) => RippleWave;
  /**
   * The driving UI-thread clock. Reading `clock.value` inside a worklet
   * registers Reanimated's dependency tracking for the wave callback.
   */
  clock: SharedValue<number>;
}

/**
 * Pure ripple sample: ease-out expansion (`1 - (1 - p)^5`, the "easeOutQuint"
 * curve) of scale and opacity at local progress `phase` of a wave.
 * Safe to call from worklets.
 */
export function rippleSample(
  phase: number,
  { minScale, maxScale, minOpacity, maxOpacity }: Required<Pick<RipplePulseOptions, 'minScale' | 'maxScale' | 'minOpacity' | 'maxOpacity'>>,
): RippleWave {
  'worklet';
  const eased = 1 - Math.pow(1 - wrapPhase(phase), 5);
  return {
    scale: minScale + (maxScale - minScale) * eased,
    opacity: maxOpacity + (minOpacity - maxOpacity) * eased,
  };
}

/**
 * Headless expanding-wave motion (alarm ringing, "live" indicators). Renders
 * nothing; the caller draws the rings and reads `wave(index)` from a worklet.
 */
export function useRipplePulse({
  minScale = 0.85,
  maxScale = 1.45,
  minOpacity = 0,
  maxOpacity = 0.55,
  duration = 2800,
  waves = 2,
  delay = 0,
  paused = false,
  pauseWhenInactive = true,
}: RipplePulseOptions = {}): UseRipplePulseReturn {
  const reduced = useReducedMotion();
  const { clock } = useLoopClock({ duration, delay, paused, pauseWhenInactive });
  const offset = phaseOffset(delay, duration);
  const count = Math.max(1, Math.floor(waves));

  const wave = useCallback(
    (index: number): RippleWave => {
      'worklet';
      if (reduced) return { scale: minScale, opacity: 0 };
      return rippleSample(clock.value + offset + index / count, { minScale, maxScale, minOpacity, maxOpacity });
    },
    [reduced, clock, offset, count, minScale, maxScale, minOpacity, maxOpacity],
  );

  return useMemo(() => ({ count, wave, clock }), [count, wave, clock]);
}
