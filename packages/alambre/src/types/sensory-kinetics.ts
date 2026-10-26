import type { SensoryCuePayload } from '../capabilities/sensory';

/**
 * Flexible representation of a sensory cue trigger:
 * - A string identifier matching a registered cue name in a sensory cues store.
 * - An object containing cue name and optional sensory payload (intensity, volume, pitch).
 * - A direct function callback for standalone haptic/audio triggering.
 */
export type SensoryCueInput<TCue extends string = string> =
  | TCue
  | { cue: TCue; payload?: SensoryCuePayload }
  | (() => void);

/**
 * Standardized sensory dispatcher interface implemented by createSensoryCues stores or actions.
 */
export interface SensoryTriggerDispatcher<TCue extends string = string> {
  trigger?: ((cue: TCue, payload?: SensoryCuePayload) => boolean | void) | ((...args: any[]) => any);
  actions?: {
    trigger: ((cue: TCue, payload?: SensoryCuePayload) => boolean | void) | ((...args: any[]) => any);
  };
}

/**
 * Standard configuration map for declarative sensory kinetics.
 */
export interface KineticSensoryConfig<TCue extends string = string> {
  /** Sensory cue triggered on press down / initiation. */
  onPressIn?: SensoryCueInput<TCue>;
  /** Sensory cue triggered on press release / settling. */
  onPressOut?: SensoryCueInput<TCue>;
  /** Sensory cue triggered when passing a critical inflection threshold (e.g. 90deg card flip). */
  onFlipMidpoint?: SensoryCueInput<TCue>;
  /** Sensory cue triggered on discrete item snapping (e.g. wheel picker step). */
  onTick?: SensoryCueInput<TCue>;
  /** Sensory cue triggered on ballistic gesture release. */
  onToss?: SensoryCueInput<TCue>;
  /** Sensory cue triggered when an item lands or settles into a drop zone or final position. */
  onLand?: SensoryCueInput<TCue>;
  /** Sensory cues store or actions instance used to dispatch named cues. */
  store?: SensoryTriggerDispatcher<TCue>;
}

/**
 * Safe JS-thread dispatcher that invokes a declarative sensory cue.
 */
export function dispatchSensoryCue<TCue extends string = string>(
  input?: SensoryCueInput<TCue> | null,
  store?: SensoryTriggerDispatcher<TCue> | null,
): void {
  if (!input) return;
  if (typeof input === 'function') {
    try {
      input();
    } catch {
      // Ignore audio/haptic driver errors
    }
    return;
  }

  const triggerFn = store?.trigger ?? store?.actions?.trigger;

  if (typeof input === 'string') {
    triggerFn?.(input);
    return;
  }
  if (typeof input === 'object' && 'cue' in input) {
    triggerFn?.(input.cue, input.payload);
  }
}
