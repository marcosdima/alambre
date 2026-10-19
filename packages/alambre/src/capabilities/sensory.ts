import type { FC, ReactElement, ReactNode } from 'react';
import type { Storage } from '../types/actions';
import createStore from '../core/create-store';
import { useExternalStore } from '../core/use-external-store';

export interface SensoryCuesState {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
}

export interface SensoryCuePayload {
  /** Optional relative intensity hint ('light' | 'medium' | 'heavy' or numeric [0..1]). */
  intensity?: 'light' | 'medium' | 'heavy' | number;
  /** Optional relative audio volume [0..1]. */
  volume?: number;
  /** Optional pitch/playback-rate multiplier (e.g., ascending pitch during cascade deals). */
  pitch?: number;
  /** Arbitrary caller metadata. */
  meta?: Record<string, unknown>;
}

export interface CreateSensoryCuesOptions<TCue extends string = string> {
  /** Initial haptics enabled state. @default true */
  initialHapticsEnabled?: boolean;
  /** Initial sound enabled state. @default true */
  initialSoundEnabled?: boolean;
  /**
   * Minimum interval in milliseconds between consecutive triggers of the same cue.
   * Prevents haptic/audio hardware flooding during rapid cascades (e.g. 10-card deal).
   * @default 35
   */
  minIntervalMs?: number;
  /** Optional per-cue cooldown overrides in milliseconds. */
  cueCooldownsMs?: Partial<Record<TCue, number>>;
  /** Haptic driver callback invoked when `hapticsEnabled` is true and cooldown allows. */
  onHaptic?: (cue: TCue, payload?: SensoryCuePayload) => void | Promise<void>;
  /** Sound driver callback invoked when `soundEnabled` is true and cooldown allows. */
  onSound?: (cue: TCue, payload?: SensoryCuePayload) => void | Promise<void>;
  /** Optional storage adapter for persisting user mute preferences. */
  storage?: Storage;
  /** Key prefix when persisting preferences to `storage`. @default 'alambre.sensory' */
  storagePrefix?: string;
  /** Clock provider for cooldown evaluation. @default Date.now */
  now?: () => number;
}

export interface SensoryCuesActions<TCue extends string = string> {
  /**
   * Triggers a named sensory cue. Returns `true` if dispatched to at least one
   * active channel, or `false` if throttled by cooldown or muted.
   */
  trigger: (cue: TCue, payload?: SensoryCuePayload) => boolean;
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
  toggleHaptics: () => Promise<boolean>;
  toggleSound: () => Promise<boolean>;
  resetCooldowns: () => void;
}

export interface UseSensoryCuesReturn<TCue extends string = string>
  extends SensoryCuesState,
    SensoryCuesActions<TCue> {}

const SensoryCuesProvider: FC<{ children?: ReactNode }> = ({ children }) =>
  (children ?? null) as ReactElement | null;

/**
 * Creates a headless sensory cues capability that coordinates haptic and audio
 * feedback adapters with user mute preferences and per-cue cooldown throttling.
 */
export function createSensoryCues<TCue extends string = string>(
  options: CreateSensoryCuesOptions<TCue> = {},
) {
  const {
    initialHapticsEnabled = true,
    initialSoundEnabled = true,
    minIntervalMs = 35,
    cueCooldownsMs,
    onHaptic,
    onSound,
    storage,
    storagePrefix = 'alambre.sensory',
    now = Date.now,
  } = options;

  const hapticsKey = `${storagePrefix}.haptics`;
  const soundKey = `${storagePrefix}.sound`;

  const store = createStore<SensoryCuesState>({
    hapticsEnabled: initialHapticsEnabled,
    soundEnabled: initialSoundEnabled,
  });

  const lastFiredMap = new Map<TCue, number>();

  const hydrate = async () => {
    if (!storage) return;
    try {
      const [rawHaptics, rawSound] = await Promise.all([
        storage.get(hapticsKey),
        storage.get(soundKey),
      ]);

      store.setState((prev) => ({
        hapticsEnabled:
          rawHaptics === 'true'
            ? true
            : rawHaptics === 'false'
              ? false
              : prev.hapticsEnabled,
        soundEnabled:
          rawSound === 'true'
            ? true
            : rawSound === 'false'
              ? false
              : prev.soundEnabled,
      }));
    } catch {
      // Ignore storage read failures and retain initial defaults
    }
  };

  void hydrate();

  const setHapticsEnabled = async (enabled: boolean) => {
    store.setState((prev) => ({ ...prev, hapticsEnabled: enabled }));
    if (storage) {
      try {
        await storage.set(hapticsKey, String(enabled));
      } catch {
        // Ignore storage write errors
      }
    }
  };

  const setSoundEnabled = async (enabled: boolean) => {
    store.setState((prev) => ({ ...prev, soundEnabled: enabled }));
    if (storage) {
      try {
        await storage.set(soundKey, String(enabled));
      } catch {
        // Ignore storage write errors
      }
    }
  };

  const toggleHaptics = async (): Promise<boolean> => {
    const next = !store.getState().hapticsEnabled;
    await setHapticsEnabled(next);
    return next;
  };

  const toggleSound = async (): Promise<boolean> => {
    const next = !store.getState().soundEnabled;
    await setSoundEnabled(next);
    return next;
  };

  const resetCooldowns = () => {
    lastFiredMap.clear();
  };

  const trigger = (cue: TCue, payload?: SensoryCuePayload): boolean => {
    const { hapticsEnabled, soundEnabled } = store.getState();
    const canHaptic = hapticsEnabled && Boolean(onHaptic);
    const canSound = soundEnabled && Boolean(onSound);

    if (!canHaptic && !canSound) {
      return false;
    }

    const currentTime = now();
    const cooldown = cueCooldownsMs?.[cue] ?? minIntervalMs;
    const lastTime = lastFiredMap.get(cue);

    if (lastTime !== undefined && cooldown > 0 && currentTime - lastTime < cooldown) {
      return false;
    }

    lastFiredMap.set(cue, currentTime);

    if (canHaptic) {
      try {
        void onHaptic?.(cue, payload);
      } catch {
        // Prevent sensory adapter errors from crashing UI interactions
      }
    }

    if (canSound) {
      try {
        void onSound?.(cue, payload);
      } catch {
        // Prevent sensory adapter errors from crashing UI interactions
      }
    }

    return true;
  };

  const actions: SensoryCuesActions<TCue> = {
    trigger,
    setHapticsEnabled,
    setSoundEnabled,
    toggleHaptics,
    toggleSound,
    resetCooldowns,
  };

  const useSensoryCues = (): UseSensoryCuesReturn<TCue> => {
    const state = useExternalStore(store, (s) => s);
    return {
      hapticsEnabled: state.hapticsEnabled,
      soundEnabled: state.soundEnabled,
      ...actions,
    };
  };

  return {
    store,
    actions,
    useSensoryCues,
    SensoryCuesProvider,
  };
}

export const createSensoryCuesProvider = createSensoryCues;
export default createSensoryCues;

