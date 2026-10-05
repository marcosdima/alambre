import React, { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import {
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
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
  const active = useSyncExternalStore(
    (onStoreChange) => {
      const sub = AppState.addEventListener('change', onStoreChange);
      return () => sub.remove();
    },
    () => AppState.currentState === 'active',
  );

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
  const elapsedDelay = useSharedValue(0);

  const running = !isStatic && !paused && appActive && duration > 0;
  const wait = Math.max(0, delay);

  const frameCallback = useFrameCallback((frameInfo) => {
    if (elapsedDelay.value < wait) {
      elapsedDelay.value += frameInfo.timeSincePreviousFrame || 0;
      return;
    }
    const delta = (frameInfo.timeSincePreviousFrame || 0) / duration;
    clock.value = wrapPhase(clock.value + delta);
  }, false);

  React.useEffect(() => {
    frameCallback.setActive(running);
  }, [running, frameCallback]);

  return { clock, isStatic };
}
