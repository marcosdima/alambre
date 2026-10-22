import { useCallback, useRef, useState } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  useReducedMotion,
  cancelAnimation,
  type SharedValue,
  type EasingFunction,
  type EasingFunctionFactory,
} from 'react-native-reanimated';
import {
  predictHandArrivalSlot,
  type PredictArrivalSlotOptions,
  type PredictedHandArrivalSlot,
  parabolicAltitudeCurve,
} from '../core/spatial';
import { parabolicTrajectory, type Point2D } from '../core/trajectory';

export interface UseHandArrivalOptions<T = any> extends PredictArrivalSlotOptions {
  /** Items currently in hand, or current item count. */
  currentHand?: readonly T[] | number;
  /** Travel duration in milliseconds for arrival flight. @default 320 */
  flightDurationMs?: number;
  /** Parabolic apex altitude in points (Y lift). @default 50 */
  liftHeight?: number;
  /** Peak scale multiplier at trajectory apex. @default 1.1 */
  peakScale?: number;
  /** Whether the card flips mid-air (180 deg rotateY). @default false */
  flipOnFly?: boolean;
  /** Reanimated easing function. Defaults to smooth decelerating bezier (0.22, 1, 0.36, 1). */
  easing?: ((t: number) => number) | EasingFunction | EasingFunctionFactory;
  /** Callback fired when an item completes flight and lands in its slot. */
  onArrivalComplete?: (item: T, slot: PredictedHandArrivalSlot) => void;
}

export interface HandArrivalFlight<T = any> {
  item: T;
  from: Point2D;
  to: Point2D;
  slot: PredictedHandArrivalSlot;
  durationMs: number;
  liftHeight: number;
  peakScale: number;
  flipOnFly: boolean;
}

export interface StartArrivalOverrides<T = any> {
  currentHand?: readonly T[] | number;
  insertionIndex?: number;
  durationMs?: number;
  liftHeight?: number;
  peakScale?: number;
  flipOnFly?: boolean;
  easing?: ((t: number) => number) | EasingFunction | EasingFunctionFactory;
}

export interface UseHandArrivalReturn<T = any> {
  /** Currently active arriving item flight, or null if idle. */
  activeArrival: HandArrivalFlight<T> | null;
  /** Whether an arrival flight is actively in progress. */
  isArriving: boolean;
  /** Shared value representing current flight progress from 0 to 1. */
  progress: SharedValue<number>;
  /** Reanimated animated style for the in-flight card container. */
  flightAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  /** Animated style for the front face layer (handles midpoint opacity swap during 3D flip). */
  frontLayerStyle: ReturnType<typeof useAnimatedStyle>;
  /** Animated style for the back face layer (handles 180deg counter-rotation & midpoint opacity swap). */
  backLayerStyle: ReturnType<typeof useAnimatedStyle>;
  /** Predicts arrival slot geometry for a given insertion index or next slot without initiating a flight. */
  predictSlot: (
    insertionIndex?: number,
    currentHandOverride?: readonly T[] | number,
  ) => PredictedHandArrivalSlot;
  /** Initiates an arrival flight from a source point into the predicted hand slot. */
  startArrival: (
    from: Point2D,
    item: T,
    overrides?: StartArrivalOverrides<T>,
  ) => PredictedHandArrivalSlot;
  /** Cancels any active arrival immediately. */
  cancelArrival: () => void;
}

/**
 * Orchestrates a single item/card arrival trajectory into an interactive hand fan.
 *
 * Eliminates the spatial discontinuity where drawn cards fly to the screen center
 * and snap abruptly into place.
 */
export function useHandArrival<T = any>(
  options: UseHandArrivalOptions<T> = {},
): UseHandArrivalReturn<T> {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const isReducedMotion = useReducedMotion();
  const [activeArrival, setActiveArrival] = useState<HandArrivalFlight<T> | null>(null);

  const progress = useSharedValue(0);
  const fromX = useSharedValue(0);
  const fromY = useSharedValue(0);
  const toX = useSharedValue(0);
  const toY = useSharedValue(0);
  const targetRotation = useSharedValue(0);
  const liftHeightSv = useSharedValue(50);
  const peakScaleSv = useSharedValue(1.1);
  const flipOnFlySv = useSharedValue(0);

  const predictSlot = useCallback(
    (
      insertionIndex?: number,
      currentHandOverride?: readonly T[] | number,
    ): PredictedHandArrivalSlot => {
      const opts = optionsRef.current;
      const hand = currentHandOverride ?? opts.currentHand ?? 0;
      return predictHandArrivalSlot(hand, {
        containerWidth: opts.containerWidth,
        centerOffset: opts.centerOffset,
        baseSpacing: opts.baseSpacing,
        spreadAngle: opts.spreadAngle,
        arcCurvature: opts.arcCurvature,
        maxSpan: opts.maxSpan,
        insertionIndex: insertionIndex ?? opts.insertionIndex,
      });
    },
    [],
  );

  const activeFlightRef = useRef<HandArrivalFlight<T> | null>(null);

  const handleFlightLanded = useCallback(() => {
    const flight = activeFlightRef.current;
    activeFlightRef.current = null;
    setActiveArrival(null);
    if (flight) {
      optionsRef.current.onArrivalComplete?.(flight.item, flight.slot);
    }
  }, []);

  const cancelArrival = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
    activeFlightRef.current = null;
    setActiveArrival(null);
  }, [progress]);

  const startArrival = useCallback(
    (
      from: Point2D,
      item: T,
      overrides: StartArrivalOverrides<T> = {},
    ): PredictedHandArrivalSlot => {
      const opts = optionsRef.current;
      const slot = predictSlot(overrides.insertionIndex, overrides.currentHand);

      const durationMs = overrides.durationMs ?? opts.flightDurationMs ?? 320;
      const lift = overrides.liftHeight ?? opts.liftHeight ?? 50;
      const peakScale = overrides.peakScale ?? opts.peakScale ?? 1.1;
      const flip = overrides.flipOnFly ?? opts.flipOnFly ?? false;

      const flight: HandArrivalFlight<T> = {
        item,
        from,
        to: slot.centerCoord,
        slot,
        durationMs,
        liftHeight: lift,
        peakScale,
        flipOnFly: flip,
      };

      activeFlightRef.current = flight;
      setActiveArrival(flight);

      fromX.value = from.x;
      fromY.value = from.y;
      toX.value = slot.centerCoord.x;
      toY.value = slot.centerCoord.y;
      targetRotation.value = slot.rotateDeg;
      liftHeightSv.value = lift;
      peakScaleSv.value = peakScale;
      flipOnFlySv.value = flip ? 1 : 0;

      if (isReducedMotion) {
        progress.value = 1;
        handleFlightLanded();
        return slot;
      }

      const resolvedEasing =
        overrides.easing ?? opts.easing ?? Easing.bezier(0.22, 1, 0.36, 1);

      progress.value = 0;
      progress.value = withTiming(
        1,
        {
          duration: Math.max(16, durationMs),
          easing: resolvedEasing,
        },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(handleFlightLanded)();
          }
        },
      );

      return slot;
    },
    [
      predictSlot,
      fromX,
      fromY,
      toX,
      toY,
      targetRotation,
      liftHeightSv,
      peakScaleSv,
      flipOnFlySv,
      isReducedMotion,
      progress,
      handleFlightLanded,
    ],
  );

  const flightAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const altitude = parabolicAltitudeCurve(p);
    const pos = parabolicTrajectory(
      p,
      { x: fromX.value, y: fromY.value },
      { x: toX.value, y: toY.value },
      liftHeightSv.value,
    );
    const currentScale = 1.0 + altitude * (peakScaleSv.value - 1.0);
    const rotZ = p * targetRotation.value;
    const rotY = flipOnFlySv.value > 0 ? (1.0 - p) * 180 : 0;

    return {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      transform: [
        { perspective: 1000 },
        { translateX: pos.x },
        { translateY: pos.y },
        { scale: currentScale },
        { rotateZ: String(rotZ) + 'deg' },
        { rotateY: String(rotY) + 'deg' },
      ],
    };
  });

  const frontLayerStyle = useAnimatedStyle(() => {
    'worklet';
    const showFront = flipOnFlySv.value === 0 || progress.value >= 0.5;
    return {
      opacity: showFront ? 1 : 0,
      zIndex: showFront ? 2 : 1,
      backfaceVisibility: 'hidden' as const,
      transform: [{ rotateY: '0deg' }],
    };
  });

  const backLayerStyle = useAnimatedStyle(() => {
    'worklet';
    const showBack = flipOnFlySv.value > 0 && progress.value < 0.5;
    return {
      opacity: showBack ? 1 : 0,
      zIndex: showBack ? 2 : 1,
      backfaceVisibility: 'hidden' as const,
      transform: [{ rotateY: '180deg' }],
    };
  });

  return {
    activeArrival,
    isArriving: activeArrival !== null,
    progress,
    flightAnimatedStyle,
    frontLayerStyle,
    backLayerStyle,
    predictSlot,
    startArrival,
    cancelArrival,
  };
}
