import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  Easing,
  cancelAnimation,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export interface LoopClockOptions {
  /** Length of one full cycle in milliseconds. */
  duration: number;
  /**
   * Start delay in milliseconds. A positive value waits before the first
   * cycle starts. Phase offsets for negative delays are applied by the
   * consumer (see `phaseOffset`).
   */
  delay?: number;
  /** Freezes the clock at its current phase while `true`. */
  paused?: boolean;
  /**
   * Freezes the clock while the app is not in the `active` AppState so that
   * continuous loops never keep the CPU awake in the background.
   * @default true
   */
  pauseWhenInactive?: boolean;
}

export interface LoopClock {
  /** Linear phase in `[0, 1]` that restarts at `0` every `duration`. */
  clock: SharedValue<number>;
  /** `true` when reduced motion is enabled: the clock never advances. */
  isStatic: boolean;
}

/**
 * Wraps any number into `[0, 1)`. Usable inside worklets.
 */
export function wrapPhase(value: number): number {
  'worklet';
  return value - Math.floor(value);
}

/**
 * Converts a CSS-style delay into a phase offset: a negative delay starts the
 * loop that far into its cycle, a positive delay has no phase offset.
 */
export function phaseOffset(delay: number, duration: number): number {
  if (delay >= 0 || duration <= 0) return 0;
  return wrapPhase(-delay / duration);
}

function useIsAppActive(enabled: boolean): boolean {
  const [active, setActive] = useState(() => AppState.currentState !== 'background' && AppState.currentState !== 'inactive');

  useEffect(() => {
    if (!enabled) return undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      setActive(state === 'active');
    });
    return () => subscription.remove();
  }, [enabled]);

  return enabled ? active : true;
}

/**
 * Internal engine shared by the headless kinetic hooks. Runs a single linear
 * `0 -> 1` loop entirely on the UI thread, and freezes it when reduced motion
 * is on, when `paused` is set, or when the app leaves the foreground.
 * Pausing keeps the current phase, so resuming continues smoothly.
 */
export function useLoopClock({
  duration,
  delay = 0,
  paused = false,
  pauseWhenInactive = true,
}: LoopClockOptions): LoopClock {
  const isStatic = useReducedMotion();
  const appActive = useIsAppActive(pauseWhenInactive);
  const clock = useSharedValue(0);

  const running = !isStatic && !paused && appActive && duration > 0;
  const wait = Math.max(0, delay);

  useEffect(() => {
    if (!running) {
      cancelAnimation(clock);
      return undefined;
    }

    // Finish the current cycle from wherever the clock is, then loop forever.
    // Each repetition explicitly restarts from 0 so the loop is independent of
    // the value the sequence started from.
    const remaining = Math.max(0, 1 - clock.value);
    clock.value = withDelay(
      wait,
      withSequence(
        withTiming(1, { duration: remaining * duration, easing: Easing.linear }),
        withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(1, { duration, easing: Easing.linear }),
          ),
          -1,
          false,
        ),
      ),
    );

    return () => cancelAnimation(clock);
  }, [running, duration, wait, clock]);

  return { clock, isStatic };
}
