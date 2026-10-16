import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  bouncyCurve,
  calculateWavefrontPhase,
  criticallyDampedCurve,
  cubicEaseOutCurve,
  polynomialOvershootCurve,
} from '../core/kinetics';

export type WavefrontCurve =
  | 'criticallyDamped'
  | 'bouncy'
  | 'easeOut'
  | 'overshoot'
  | 'linear';

export interface UseWavefrontOptions {
  /**
   * Total number of items participating in the wavefront.
   */
  count: number;
  /**
   * Stagger delay between consecutive item starts (in ms).
   * @default 35
   */
  staggerMs?: number;
  /**
   * Duration of each item's individual transition window (in ms).
   * @default 280
   */
  itemDuration?: number;
  /**
   * Closed-form analytical curve applied to each item's phase.
   * @default 'criticallyDamped'
   */
  curve?: WavefrontCurve;
  /**
   * Whether to automatically start on mount.
   * @default true
   */
  autoStart?: boolean;
  /**
   * Optional callback when all items in the wavefront finish.
   */
  onComplete?: () => void;
}

export interface UseWavefrontReturn {
  /**
   * Single master progress shared value in [0, 1] driving all items.
   */
  progress: SharedValue<number>;
  /**
   * Alias for `progress`.
   */
  masterProgress: SharedValue<number>;
  /**
   * UI-thread worklet returning the curved [0, 1] progress for item `index`.
   * Optionally pass `progressOverride` (such as `progress.value`) to explicitly register
   * the SharedValue dependency inside Reanimated worklets.
   */
  getItemProgress: (index: number, progressOverride?: number) => number;
  /**
   * UI-thread worklet returning the raw linear phase [0, 1] for item `index`.
   */
  getItemPhase: (index: number, progressOverride?: number) => number;
  /**
   * Starts or restarts the wavefront transition.
   */
  start: () => void;
  /**
   * Resets the wavefront progress back to 0.
   */
  reset: () => void;
  /**
   * Whether user has enabled reduced motion.
   */
  isReducedMotion: boolean;
  /**
   * Total duration calculated for the entire wavefront (in ms).
   */
  totalDuration: number;
}

/**
 * Headless traveling wavefront hook.
 *
 * Coordinates N staggered element animations purely on the UI thread using
 * a SINGLE master clock and closed-form analytical curves. Eliminates spring
 * concurrency overload (the N-ODE problem) and guarantees 60/120fps budget.
 */
export function useWavefront({
  count,
  staggerMs = 35,
  itemDuration = 280,
  curve = 'criticallyDamped',
  autoStart = true,
  onComplete,
}: UseWavefrontOptions): UseWavefrontReturn {
  const isReducedMotion = useReducedMotion();
  const masterProgress = useSharedValue(isReducedMotion ? 1 : 0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const notifyComplete = useCallback(() => {
    onCompleteRef.current?.();
  }, []);

  const totalStagger = Math.max(0, (count - 1) * staggerMs);
  const totalDuration = totalStagger + itemDuration;
  const totalDurationRef = useRef(totalDuration);
  totalDurationRef.current = totalDuration;

  const start = useCallback(() => {
    if (isReducedMotion) {
      masterProgress.value = 1;
      notifyComplete();
      return;
    }

    masterProgress.value = 0;
    masterProgress.value = withTiming(
      1,
      {
        duration: totalDurationRef.current,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(notifyComplete)();
        }
      },
    );
  }, [isReducedMotion, masterProgress, notifyComplete]);

  const reset = useCallback(() => {
    masterProgress.value = isReducedMotion ? 1 : 0;
  }, [isReducedMotion, masterProgress]);

  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && !autoStartedRef.current) {
      autoStartedRef.current = true;
      start();
    }
  }, [autoStart, start]);

  const getItemPhase = useCallback(
    (index: number, progressOverride?: number): number => {
      'worklet';
      if (isReducedMotion) return 1;
      const tau = progressOverride !== undefined ? progressOverride : masterProgress.value;
      return calculateWavefrontPhase(tau, index, count, {
        staggerMs,
        itemDuration,
        totalDuration,
      });
    },
    [isReducedMotion, masterProgress, count, staggerMs, itemDuration, totalDuration],
  );

  const getItemProgress = useCallback(
    (index: number, progressOverride?: number): number => {
      'worklet';
      if (isReducedMotion) return 1;
      const rawPhase = getItemPhase(index, progressOverride);

      switch (curve) {
        case 'bouncy':
          return bouncyCurve(rawPhase);
        case 'easeOut':
          return cubicEaseOutCurve(rawPhase);
        case 'overshoot':
          return polynomialOvershootCurve(rawPhase);
        case 'linear':
          return rawPhase;
        case 'criticallyDamped':
        default:
          return criticallyDampedCurve(rawPhase);
      }
    },
    [isReducedMotion, getItemPhase, curve],
  );

  return useMemo(
    () => ({
      progress: masterProgress,
      masterProgress,
      getItemProgress,
      getItemPhase,
      start,
      reset,
      isReducedMotion,
      totalDuration,
    }),
    [masterProgress, getItemProgress, getItemPhase, start, reset, isReducedMotion, totalDuration],
  );
}

// ---------------------------------------------------------------------------
// Wavefront Context & Provider
// ---------------------------------------------------------------------------

const WavefrontContext = createContext<UseWavefrontReturn | null>(null);

export type WavefrontProviderProps =
  | {
      value: UseWavefrontReturn;
      children: ReactNode;
    }
  | (UseWavefrontOptions & {
      value?: undefined;
      children: ReactNode;
    });

function WavefrontInternalProvider({
  children,
  ...options
}: UseWavefrontOptions & { children: ReactNode }) {
  const wavefront = useWavefront(options);
  return (
    <WavefrontContext.Provider value={wavefront}>
      {children}
    </WavefrontContext.Provider>
  );
}

/**
 * Optional Context Provider to propagate a single wavefront master clock down a component tree.
 * Can either instantiate a new wavefront (passing UseWavefrontOptions) or forward an
 * existing `value={wavefront}` instance.
 */
export function WavefrontProvider(props: WavefrontProviderProps) {
  if ('value' in props && props.value !== undefined) {
    return (
      <WavefrontContext.Provider value={props.value}>
        {props.children}
      </WavefrontContext.Provider>
    );
  }
  const { children, ...options } = props as UseWavefrontOptions & { children: ReactNode };
  return <WavefrontInternalProvider {...options}>{children}</WavefrontInternalProvider>;
}

// ---------------------------------------------------------------------------
// useWavefrontItem
// ---------------------------------------------------------------------------

export type WavefrontPreset =
  | 'slide-up'
  | 'slide-down'
  | 'slide-scale'
  | 'fade'
  | 'scale'
  | 'pop';

export type WavefrontItemPreset = WavefrontPreset;

export type WavefrontStyleWorklet = (
  progress: number,
  phase: number,
) => Record<string, unknown>;

export interface UseWavefrontItemOptions {
  /**
   * Explicit wavefront instance. If omitted, consumes from WavefrontContext.
   */
  wavefront?: UseWavefrontReturn;
  /**
   * Built-in transition preset.
   * @default 'slide-up'
   */
  preset?: WavefrontPreset;
  /**
   * Distance in points for slide presets.
   * @default 20
   */
  distance?: number;
  /**
   * Custom style worklet function receiving item progress [0, 1] and raw phase [0, 1].
   * IMPORTANT: If provided, the function must include the `'worklet';` directive to execute on the UI thread.
   * @example
   * style: (p, phase) => {
   *   'worklet';
   *   return { opacity: p, transform: [{ scale: 0.9 + p * 0.1 }] };
   * }
   */
  style?: WavefrontStyleWorklet;
  /**
   * Force reduced motion behavior (e.g. for testing or override).
   * @default false
   */
  forceReducedMotion?: boolean;
}

export interface UseWavefrontItemReturn {
  /**
   * Animated style to apply directly to `<Animated.View style={animatedStyle}>`.
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /**
   * UI-thread worklet returning the curved progress [0, 1] for this item.
   */
  getProgress: (progressOverride?: number) => number;
  /**
   * UI-thread worklet returning the raw linear phase [0, 1] for this item.
   */
  getPhase: (progressOverride?: number) => number;
  /**
   * Master progress shared value driving the entire wavefront.
   */
  masterProgress: SharedValue<number>;
  /**
   * Whether reduced motion is active (or forced).
   */
  isReducedMotion: boolean;
  /**
   * Reference to the parent wavefront instance.
   */
  wavefront: UseWavefrontReturn;
}

/**
 * Headless hook for an individual item participating in a wavefront animation.
 *
 * Provides a ready-to-use `animatedStyle` adhering to the 3-Line Rule:
 * ```tsx
 * const { animatedStyle } = useWavefrontItem(index, { preset: 'slide-up' });
 * return <Animated.View style={animatedStyle}>...</Animated.View>;
 * ```
 */
export function useWavefrontItem(
  index: number,
  options: UseWavefrontItemOptions = {},
): UseWavefrontItemReturn {
  const context = useContext(WavefrontContext);
  const wavefront = options.wavefront ?? context;

  if (!wavefront) {
    throw new Error(
      '[alambre] useWavefrontItem must be used within a <WavefrontProvider> or passed an explicit "wavefront" instance in options.',
    );
  }

  const {
    preset = 'slide-up',
    distance = 20,
    style: customStyle,
    forceReducedMotion = false,
  } = options;

  const isReducedMotion = forceReducedMotion || wavefront.isReducedMotion;

  const getProgress = useCallback(
    (progressOverride?: number) => {
      'worklet';
      return wavefront.getItemProgress(index, progressOverride);
    },
    [wavefront, index],
  );

  const getPhase = useCallback(
    (progressOverride?: number) => {
      'worklet';
      return wavefront.getItemPhase(index, progressOverride);
    },
    [wavefront, index],
  );

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    // Always read masterProgress.value on the UI thread to guarantee reactivity subscription
    const tau = wavefront.progress.value;

    if (isReducedMotion) {
      if (customStyle) {
        return customStyle(1, 1);
      }
      switch (preset) {
        case 'fade':
          return { opacity: 1 };
        case 'scale':
        case 'pop':
          return { opacity: 1, transform: [{ scale: 1 }] };
        case 'slide-scale':
          return { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] };
        case 'slide-down':
        case 'slide-up':
        default:
          return { opacity: 1, transform: [{ translateY: 0 }] };
      }
    }

    const p = wavefront.getItemProgress(index, tau);
    const phase = wavefront.getItemPhase(index, tau);

    if (customStyle) {
      return customStyle(p, phase);
    }

    switch (preset) {
      case 'fade':
        return { opacity: p };
      case 'scale':
        return {
          opacity: p,
          transform: [{ scale: 0.9 + p * 0.1 }],
        };
      case 'pop':
        return {
          opacity: p,
          transform: [{ scale: 0.8 + p * 0.2 }],
        };
      case 'slide-down':
        return {
          opacity: p,
          transform: [{ translateY: -(1 - p) * distance }],
        };
      case 'slide-scale':
        return {
          opacity: p,
          transform: [
            { translateY: (1 - p) * distance },
            { scale: 0.96 + p * 0.04 },
          ],
        };
      case 'slide-up':
      default:
        return {
          opacity: p,
          transform: [{ translateY: (1 - p) * distance }],
        };
    }
  }, [wavefront, isReducedMotion, index, preset, distance, customStyle]);

  return useMemo(
    () => ({
      animatedStyle,
      getProgress,
      getPhase,
      masterProgress: wavefront.progress,
      isReducedMotion,
      wavefront,
    }),
    [animatedStyle, getProgress, getPhase, wavefront, isReducedMotion],
  );
}

// ---------------------------------------------------------------------------
// Convenient kinetic orchestrator aliases
// ---------------------------------------------------------------------------

export const useKineticOrchestrator = useWavefront;
export type UseKineticOrchestratorOptions = UseWavefrontOptions;
export type UseKineticOrchestratorReturn = UseWavefrontReturn;

export const KineticOrchestratorProvider = WavefrontProvider;
export type KineticOrchestratorProviderProps = WavefrontProviderProps;

export const useKineticOrchestratorItem = useWavefrontItem;
export type UseKineticOrchestratorItemOptions = UseWavefrontItemOptions;
export type UseKineticOrchestratorItemReturn = UseWavefrontItemReturn;

export type KineticPreset = WavefrontPreset;
export type KineticItemPreset = WavefrontItemPreset;
