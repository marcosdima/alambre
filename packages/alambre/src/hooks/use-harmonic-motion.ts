import { useDerivedValue, type DerivedValue } from 'react-native-reanimated';
import { phaseOffset, useLoopClock, wrapPhase } from './use-loop-clock';

/**
 * Shape of one cycle:
 * - `sine`:   smooth oscillation `amplitude * sin(2πφ)`. Covers pendulum swing,
 *             floating, tilting and slow ambient drift.
 * - `spin`:   linear ramp `amplitude * φ` (pass `360` for a full turn per cycle).
 * - `wobble`: rest, then a short decaying burst (`0 → -1 → +1 → -0.5 → 0`)
 *             between 88% and 97% of the cycle, like a ringing bell.
 * - `beat`:   non-linear pulse `0 → 1 → -0.22 → 0.44 → 0` during the first 60%
 *             of the cycle, then rest. With `amplitude: 0.18`, `1 + value` is a
 *             systole/diastole heartbeat scale (1 → 1.18 → 0.96 → 1.08 → 1).
 */
export type HarmonicProfile = 'sine' | 'spin' | 'wobble' | 'beat';

export interface HarmonicMotionOptions {
  /** Cycle shape. @default 'sine' */
  profile?: HarmonicProfile;
  /** Peak magnitude, in whatever unit the consumer applies (deg, px, scale delta). @default 1 */
  amplitude?: number;
  /** Length of one cycle in milliseconds. @default 4000 */
  duration?: number;
  /**
   * Milliseconds. Positive waits before starting; negative starts the loop
   * that far into its cycle (use it to desynchronise sibling elements).
   * @default 0
   */
  delay?: number;
  /** Freezes the motion at its current value. @default false */
  paused?: boolean;
  /**
   * Freezes the motion while the app is backgrounded.
   * @default true
   */
  pauseWhenInactive?: boolean;
}

// [phase, normalised value] keyframes, linearly interpolated.
const WOBBLE_KEYS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [0.88, 0], [0.91, -1], [0.94, 1], [0.97, -0.5], [1, 0],
];
const BEAT_KEYS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [0.15, 1], [0.3, -0.22], [0.45, 0.44], [0.6, 0], [1, 0],
];

function sampleKeyframes(keys: ReadonlyArray<readonly [number, number]>, phase: number): number {
  'worklet';
  for (let i = 1; i < keys.length; i += 1) {
    const [p1, v1] = keys[i];
    if (phase <= p1) {
      const [p0, v0] = keys[i - 1];
      const span = p1 - p0;
      return span === 0 ? v1 : v0 + ((v1 - v0) * (phase - p0)) / span;
    }
  }
  return keys[keys.length - 1][1];
}

/**
 * Pure profile function. `phase` is any number: it is wrapped into `[0, 1)`.
 * Safe to call from worklets.
 */
export function harmonicValue(profile: HarmonicProfile, phase: number, amplitude: number): number {
  'worklet';
  const p = wrapPhase(phase);
  switch (profile) {
    case 'spin':
      return amplitude * p;
    case 'wobble':
      return amplitude * sampleKeyframes(WOBBLE_KEYS, p);
    case 'beat':
      return amplitude * sampleKeyframes(BEAT_KEYS, p);
    case 'sine':
    default:
      return amplitude * Math.sin(2 * Math.PI * p);
  }
}

/**
 * Headless periodic motion. Returns a read-only shared value that cycles on the
 * UI thread; map it to rotation, translation or scale with `useAnimatedStyle` /
 * `useAnimatedProps`. Renders nothing.
 *
 * Reduced motion holds the value at its rest pose (`harmonicValue(..., 0)`),
 * and the loop freezes while paused or while the app is backgrounded.
 */
export function useHarmonicMotion({
  profile = 'sine',
  amplitude = 1,
  duration = 4000,
  delay = 0,
  paused = false,
  pauseWhenInactive = true,
}: HarmonicMotionOptions = {}): DerivedValue<number> {
  const { clock, isStatic } = useLoopClock({ duration, delay, paused, pauseWhenInactive });
  const offset = phaseOffset(delay, duration);

  return useDerivedValue(
    () => harmonicValue(profile, isStatic ? 0 : clock.value + offset, amplitude),
    [profile, amplitude, offset, isStatic],
  );
}
