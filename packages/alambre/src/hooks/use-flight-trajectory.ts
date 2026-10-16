import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
  cancelAnimation,
  Extrapolation,
  useReducedMotion,
  type SharedValue,
  type EasingFunction,
  type EasingFunctionFactory,
} from 'react-native-reanimated';
import { parabolicAltitudeCurve } from '../core/spatial';

export interface Point2D {
  x: number;
  y: number;
}

export interface FlightStartOverrides {
  from?: Point2D;
  to?: Point2D;
  fromRotation?: number;
  targetRotation?: number;
  durationMs?: number;
}

export interface UseFlightTrajectoryOptions {
  /**
   * Starting coordinates in points.
   */
  from: Point2D;
  /**
   * Destination coordinates in points.
   */
  to: Point2D;
  /**
   * Initial rotation angle in degrees.
   * @default 0
   */
  fromRotation?: number;
  /**
   * Target rotation angle in degrees.
   * @default 0
   */
  targetRotation?: number;
  /**
   * Peak vertical lift in points during parabolic flight (positive value lifts upward, i.e. negative translateY).
   * @default 55
   */
  liftHeight?: number;
  /**
   * Peak scale at flight midpoint (simulating altitude toward camera).
   * @default 1.15
   */
  peakScale?: number;
  /**
   * Starting scale when launching.
   * @default 0.9
   */
  startScale?: number;
  /**
   * Final scale upon arrival.
   * @default 1.0
   */
  endScale?: number;
  /**
   * Duration of the flight in milliseconds.
   * @default 380
   */
  durationMs?: number;
  /**
   * Reanimated easing function.
   * @default Easing.bezier(0.22, 1, 0.36, 1) (snappy launch with smooth decelerating landing)
   */
  easing?: ((t: number) => number) | EasingFunction | EasingFunctionFactory;
  /**
   * Whether flight animation starts automatically upon mount / coordinate update.
   * @default true
   */
  autoStart?: boolean;
  /**
   * Whether to flip 180 degrees around Y axis mid-flight.
   * @default false
   */
  flipOnFly?: boolean;
  /**
   * Perspective distance for 3D transforms.
   * @default 1000
   */
  perspective?: number;
  /**
   * Container zIndex during flight.
   * @default 9999
   */
  zIndex?: number;
  /**
   * Callback fired when flight trajectory finishes.
   */
  onComplete?: () => void;
  /**
   * Override reduced motion detection.
   */
  forceReducedMotion?: boolean;
}

export interface UseFlightTrajectoryReturn {
  /**
   * Animated style to apply to the flying container.
   * Includes perspective, translateX, translateY (with parabolic lift), rotate, and scale.
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /**
   * Animated style to apply to the front face component.
   */
  frontAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  /**
   * Animated style to apply to the back face component.
   */
  backAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  /**
   * Shared value tracking flight progress (0 = departure, 1 = arrival).
   */
  progress: SharedValue<number>;
  /**
   * Starts or restarts the flight animation, with optional coordinate/rotation overrides.
   */
  start: (overrides?: FlightStartOverrides) => void;
  /**
   * Resets flight progress immediately to 0.
   */
  reset: () => void;
  /**
   * Synchronous JS boolean representing whether flight is currently in progress.
   */
  isFlying: boolean;
}

let cachedDefaultEasing: ((t: number) => number) | EasingFunction | EasingFunctionFactory | undefined;
function getDefaultFlightEasing(): ((t: number) => number) | EasingFunction | EasingFunctionFactory {
  if (!cachedDefaultEasing) {
    if (typeof Easing !== 'undefined' && typeof Easing?.bezier === 'function') {
      cachedDefaultEasing = Easing.bezier(0.22, 1, 0.36, 1);
    } else {
      cachedDefaultEasing = (t: number) => 1 - Math.pow(1 - t, 3);
    }
  }
  return cachedDefaultEasing!;
}

export function useFlightTrajectory(options: UseFlightTrajectoryOptions): UseFlightTrajectoryReturn {
  const {
    from,
    to,
    fromRotation = 0,
    targetRotation = 0,
    liftHeight = 55,
    peakScale = 1.15,
    startScale = 0.9,
    endScale = 1.0,
    durationMs = 380,
    easing,
    autoStart = true,
    flipOnFly = false,
    perspective = 1000,
    zIndex = 9999,
    onComplete,
    forceReducedMotion,
  } = options;

  const resolvedEasing = easing ?? getDefaultFlightEasing();

  const reducedMotionPref = useReducedMotion();
  const isReducedMotion = forceReducedMotion ?? (reducedMotionPref ?? false);

  const progress = useSharedValue(0);
  const fromX = useSharedValue(from.x);
  const fromY = useSharedValue(from.y);
  const toX = useSharedValue(to.x);
  const toY = useSharedValue(to.y);
  const fromRot = useSharedValue(fromRotation);
  const toRot = useSharedValue(targetRotation);

  const [isFlying, setIsFlying] = useState(false);
  const configRef = useRef({ durationMs, easing: resolvedEasing, onComplete });

  useEffect(() => {
    configRef.current = { durationMs, easing: resolvedEasing, onComplete };
  });

  useEffect(() => {
    fromX.value = from.x;
    fromY.value = from.y;
    toX.value = to.x;
    toY.value = to.y;
    fromRot.value = fromRotation;
    toRot.value = targetRotation;
  }, [from.x, from.y, to.x, to.y, fromRotation, targetRotation, fromX, fromY, toX, toY, fromRot, toRot]);

  const start = useCallback(
    (overrides?: FlightStartOverrides) => {
      if (overrides?.from) {
        fromX.value = overrides.from.x;
        fromY.value = overrides.from.y;
      }
      if (overrides?.to) {
        toX.value = overrides.to.x;
        toY.value = overrides.to.y;
      }
      if (overrides?.fromRotation !== undefined) {
        fromRot.value = overrides.fromRotation;
      }
      if (overrides?.targetRotation !== undefined) {
        toRot.value = overrides.targetRotation;
      }

      const activeDuration = Math.max(80, overrides?.durationMs ?? configRef.current.durationMs);
      const activeEasing = configRef.current.easing;

      cancelAnimation(progress);
      progress.value = 0;
      setIsFlying(true);

      if (isReducedMotion) {
        progress.value = 1;
        setIsFlying(false);
        configRef.current.onComplete?.();
        return;
      }

      progress.value = withTiming(
        1,
        {
          duration: activeDuration,
          easing: activeEasing,
        },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(setIsFlying)(false);
            if (configRef.current.onComplete) {
              runOnJS(configRef.current.onComplete)();
            }
          }
        },
      );
    },
    [fromRot, fromX, fromY, isReducedMotion, progress, toRot, toX, toY],
  );

  const reset = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
    setIsFlying(false);
  }, [progress]);

  const lastCoordsRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoStart) return;
    const coordKey = `${from.x},${from.y}->${to.x},${to.y}`;
    if (lastCoordsRef.current === coordKey) return;
    lastCoordsRef.current = coordKey;
    start();
    return () => {
      cancelAnimation(progress);
    };
  }, [autoStart, from.x, from.y, to.x, to.y, start, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(1, progress.value));
    const curX = interpolate(p, [0, 1], [fromX.value, toX.value]);
    const arcLift = -parabolicAltitudeCurve(p) * liftHeight;
    const curY = interpolate(p, [0, 1], [fromY.value, toY.value]) + arcLift;
    const curRot = interpolate(p, [0, 1], [fromRot.value, toRot.value]);
    const scale = interpolate(
      p,
      [0, 0.5, 1],
      [startScale, peakScale, endScale],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { perspective },
        { translateX: curX },
        { translateY: curY },
        { rotate: `${curRot}deg` },
        { scale },
      ],
      zIndex,
    };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    if (!flipOnFly) {
      return {
        opacity: 1,
        zIndex: 1,
        backfaceVisibility: 'hidden',
      };
    }
    const p = Math.max(0, Math.min(1, progress.value));
    const rotateY = interpolate(p, [0, 1], [180, 0], Extrapolation.CLAMP);
    const opacity = p < 0.5 ? 0 : 1;
    return {
      transform: [{ perspective }, { rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: p >= 0.5 ? 2 : 1,
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    if (!flipOnFly) {
      return {
        opacity: 0,
        zIndex: 0,
        backfaceVisibility: 'hidden',
      };
    }
    const p = Math.max(0, Math.min(1, progress.value));
    const rotateY = interpolate(p, [0, 1], [360, 180], Extrapolation.CLAMP);
    const opacity = p >= 0.5 ? 0 : 1;
    return {
      transform: [{ perspective }, { rotateY: `${rotateY}deg` }],
      opacity,
      zIndex: p < 0.5 ? 2 : 1,
      backfaceVisibility: 'hidden',
    };
  });

  return {
    animatedStyle,
    frontAnimatedStyle,
    backAnimatedStyle,
    progress,
    start,
    reset,
    isFlying,
  };
}
