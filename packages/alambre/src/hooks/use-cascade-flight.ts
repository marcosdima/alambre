import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  cancelAnimation,
  runOnJS,
  useReducedMotion,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { parabolicTrajectory, type Point2D } from '../core/trajectory';
import {
  computeSpatialCascadePlan,
  type SpatialCascadeOptions,
  type SpatialFlightSpec,
} from '../core/spatial';

export interface UseCascadeFlightOptions<T extends { id: string }> {
  /** Center point where the draw deck or source stack is located. */
  origin?: Point2D;
  /** Alias for `origin` (backward-compatible with card-game). */
  deckOrigin?: Point2D;
  /** Center point of the receiving hand or container area. */
  targetCenter?: Point2D;
  /** Alias for `targetCenter` (backward-compatible with card-game). */
  handCenter?: Point2D;
  /** Width of the target container for responsive fan calculations. */
  containerWidth?: number;
  /** Alias for `containerWidth` (backward-compatible with card-game). */
  handContainerWidth?: number;
  /** Stagger delay in milliseconds between consecutive launches. @default 90 */
  staggerDelayMs?: number;
  /** Travel duration in milliseconds for each individual flight. @default 340 */
  flightDurationMs?: number;
  /** Parabolic apex altitude in points (Y lift). @default 55 */
  liftHeight?: number;
  /** Peak scale multiplier at trajectory apex. @default 1.12 */
  peakScale?: number;
  /** Whether the item flips mid-air (180° rotateY) from face-down to face-up. @default true */
  flipOnFly?: boolean;
  /** Callback fired immediately when an individual item touches down into its target slot. */
  onItemLanded?: (item: T, targetSlotIndex: number) => void;
  /** Alias for `onItemLanded` (backward-compatible with card-game). */
  onCardLanded?: (item: T, targetSlotIndex: number) => void;
  /** Callback fired when the final item in the cascade finishes landing. */
  onCascadeComplete?: (dealtItems: T[]) => void;
}

export interface UseCascadeFlightReturn<T extends { id: string }> {
  /** List of currently in-flight item specs. */
  activeFlights: SpatialFlightSpec<T>[];
  /** Whether a cascade flight is actively in progress. */
  isDealing: boolean;
  /** Triggers a cascaded sequential flight for the given items into the target container. */
  startDeal: (
    itemsToDeal: readonly T[],
    currentItems?: readonly T[],
    overrides?: Partial<SpatialCascadeOptions<T>>,
  ) => void;
  /** Callback to notify the hook when a specific flight completes its touchdown. */
  handleFlightComplete: (itemId: string) => void;
  /** Cancels any active flights immediately. */
  cancelDeal: () => void;
}

/**
 * Orchestrates staggered multi-item parabolic flights from a source stack into
 * responsive fan slots.
 */
export function useCascadeFlight<T extends { id: string }>(
  options: UseCascadeFlightOptions<T>,
): UseCascadeFlightReturn<T> {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [activeFlights, setActiveFlights] = useState<SpatialFlightSpec<T>[]>([]);
  const pendingBatchRef = useRef<T[]>([]);
  const landedCountRef = useRef(0);
  const totalInBatchRef = useRef(0);

  const startDeal = useCallback(
    (
      itemsToDeal: readonly T[],
      currentItems: readonly T[] = [],
      overrides: Partial<SpatialCascadeOptions<T>> = {},
    ) => {
      if (itemsToDeal.length === 0) return;

      const opts = optionsRef.current;
      const mergedOptions: SpatialCascadeOptions<T> = {
        origin: opts.origin ?? opts.deckOrigin,
        targetCenter: opts.targetCenter ?? opts.handCenter,
        containerWidth: opts.containerWidth ?? opts.handContainerWidth,
        staggerDelayMs: opts.staggerDelayMs ?? 90,
        flightDurationMs: opts.flightDurationMs ?? 340,
        liftHeight: opts.liftHeight ?? 55,
        peakScale: opts.peakScale ?? 1.12,
        flipOnFly: opts.flipOnFly ?? true,
        currentItems,
        ...overrides,
      };

      const plan = computeSpatialCascadePlan(itemsToDeal, mergedOptions);
      pendingBatchRef.current = [...itemsToDeal];
      landedCountRef.current = 0;
      totalInBatchRef.current = plan.specs.length;
      setActiveFlights(plan.specs);
    },
    [],
  );

  const handleFlightComplete = useCallback((itemId: string) => {
    setActiveFlights((prev) => {
      const completedSpec = prev.find((s) => s.item.id === itemId);
      if (completedSpec) {
        const onLanded = optionsRef.current.onItemLanded ?? optionsRef.current.onCardLanded;
        onLanded?.(completedSpec.item, completedSpec.targetSlotIndex);
      }
      return prev.filter((s) => s.item.id !== itemId);
    });

    landedCountRef.current += 1;
    if (landedCountRef.current >= totalInBatchRef.current && totalInBatchRef.current > 0) {
      const completedBatch = [...pendingBatchRef.current];
      pendingBatchRef.current = [];
      landedCountRef.current = 0;
      totalInBatchRef.current = 0;
      optionsRef.current.onCascadeComplete?.(completedBatch);
    }
  }, []);

  const cancelDeal = useCallback(() => {
    setActiveFlights([]);
    pendingBatchRef.current = [];
    landedCountRef.current = 0;
    totalInBatchRef.current = 0;
  }, []);

  return {
    activeFlights,
    isDealing: activeFlights.length > 0,
    startDeal,
    handleFlightComplete,
    cancelDeal,
  };
}

export const useDealCascade = useCascadeFlight;
export type UseDealCascadeOptions<T extends { id: string } = { id: string }> =
  UseCascadeFlightOptions<T>;
export type UseDealCascadeReturn<T extends { id: string } = { id: string }> =
  UseCascadeFlightReturn<T>;

export interface UseCascadeFlightItemOptions<T extends { id: string }> {
  spec: SpatialFlightSpec<T>;
  onComplete: () => void;
  perspective?: number;
  forceReducedMotion?: boolean;
}

export interface UseCascadeFlightItemReturn {
  progress: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  frontLayerStyle: ReturnType<typeof useAnimatedStyle>;
  backLayerStyle: ReturnType<typeof useAnimatedStyle>;
}

/**
 * UI-thread driver for an individual flight spec in a cascade deal.
 * Schedules stagger launch directly on the UI thread via Reanimated `withDelay`
 * rather than JS `setTimeout`.
 */
export function useCascadeFlightItem<T extends { id: string }>({
  spec,
  onComplete,
  perspective = 1000,
  forceReducedMotion = false,
}: UseCascadeFlightItemOptions<T>): UseCascadeFlightItemReturn {
  const systemReduced = useReducedMotion();
  const isReduced = forceReducedMotion || Boolean(systemReduced);

  const progress = useSharedValue(0);
  const visible = useSharedValue(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const notifyComplete = useCallback(() => {
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    if (isReduced) {
      progress.value = 1;
      visible.value = 1;
      notifyComplete();
      return;
    }

    const easing = Easing.bezier(0.22, 1, 0.36, 1);
    const delay = Math.max(0, spec.startDelayMs);
    const duration = Math.max(1, spec.durationMs);

    progress.value = 0;
    visible.value = delay === 0 ? 1 : 0;

    if (delay > 0) {
      visible.value = withDelay(delay, withTiming(1, { duration: Math.min(60, duration * 0.25) }));
      progress.value = withDelay(
        delay,
        withTiming(1, { duration, easing }, (finished) => {
          'worklet';
          if (finished) {
            runOnJS(notifyComplete)();
          }
        }),
      );
    } else {
      progress.value = withTiming(1, { duration, easing }, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(notifyComplete)();
        }
      });
    }

    return () => {
      cancelAnimation(progress);
      cancelAnimation(visible);
    };
  }, [isReduced, notifyComplete, progress, spec, visible]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const t = progress.value;
    const pt = parabolicTrajectory(t, spec.from, spec.to, spec.liftHeight);
    const altitude = 4 * t * (1 - t);
    const currentScale = 1 + (spec.peakScale - 1) * altitude;
    const rotZ = spec.fromRotation + (spec.targetRotation - spec.fromRotation) * t;
    const rotY = spec.flipOnFly ? 180 * (1 - t) : 0;

    return {
      opacity: visible.value,
      transform: [
        { perspective },
        { translateX: pt.x },
        { translateY: pt.y },
        { rotate: `${rotZ}deg` },
        { rotateY: `${rotY}deg` },
        { scale: currentScale },
      ],
    };
  });

  const frontLayerStyle = useAnimatedStyle(() => ({
    backfaceVisibility: 'hidden' as const,
    transform: [{ rotateY: '0deg' }],
  }));

  const backLayerStyle = useAnimatedStyle(() => ({
    backfaceVisibility: 'hidden' as const,
    transform: [{ rotateY: '180deg' }],
  }));

  return {
    progress,
    animatedStyle,
    frontLayerStyle,
    backLayerStyle,
  };
}

