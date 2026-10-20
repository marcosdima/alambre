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

export interface StartArrivalOverrides {
  insertionIndex?: number;
  durationMs?: number;
  liftHeight?: number;
  peakScale?: number;
  flipOnFly?: boolean;
}

export interface UseHandArrivalReturn<T = any> {
  /** Currently active arriving item flight, or null if idle. */
  activeArrival: HandArrivalFlight<T> | null;
  /** Whether an arrival flight is actively in progress. */
  isArriving: boolean;
  /** Shared value representing current flight progress from 0 to 1. */
  progress: SharedValue<number>;
  /** Reanimated animated style for the in-flight card. */
  flightAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  /** Predicts arrival slot geometry for a given insertion index or next slot without initiating a flight. */
  predictSlot: (insertionIndex?: number) => PredictedHandArrivalSlot;
  /** Initiates an arrival flight from a source point into the predicted hand slot. */
  startArrival: (
    from: Point2D,
    item: T,
    overrides?: StartArrivalOverrides,
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
    (insertionIndex?: number): PredictedHandArrivalSlot => {
      const opts = optionsRef.current;
      const hand = opts.currentHand ?? 0;
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

  const handleFlightLanded = useCallback(
    (flight: HandArrivalFlight<T>) => {
      setActiveArrival(null);
      optionsRef.current.onArrivalComplete?.(flight.item, flight.slot);
    },
    [],
  );

  const cancelArrival = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
    setActiveArrival(null);
  }, [progress]);

  const startArrival = useCallback(
    (
      from: Point2D,
      item: T,
      overrides: StartArrivalOverrides = {},
    ): PredictedHandArrivalSlot => {
      const opts = optionsRef.current;
      const slot = predictSlot(overrides.insertionIndex);

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
        handleFlightLanded(flight);
        return slot;
      }

      progress.value = 0;
      progress.value = withTiming(
        1,
        {
          duration: Math.max(16, durationMs),
          easing: Easing.bezier(0.25, 1, 0.5, 1),
        },
        (finished) => {
          if (finished) {
            runOnJS(handleFlightLanded)(flight);
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
        { translateX: pos.x },
        { translateY: pos.y },
        { scale: currentScale },
        { rotateZ: String(rotZ) + 'deg' },
        { rotateY: String(rotY) + 'deg' },
      ],
    };
  });

  return {
    activeArrival,
    isArriving: activeArrival !== null,
    progress,
    flightAnimatedStyle,
    predictSlot,
    startArrival,
    cancelArrival,
  };
}
