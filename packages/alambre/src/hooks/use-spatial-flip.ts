import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  useReducedMotion,
  cancelAnimation,
  runOnJS,
  type WithSpringConfig,
  type SharedValue,
} from 'react-native-reanimated';
import { kinetics } from '../core/kinetics';

export interface UseSpatialFlipOptions {
  /**
   * Controlled flipped state. When provided, the hook animates whenever this value changes.
   * If omitted, the hook operates in uncontrolled mode via `flip()` and `setFlipped()`.
   */
  flipped?: boolean;
  /**
   * Initial flipped state when operating uncontrolled.
   * @default false (false = front / face up, true = back / face down)
   */
  initialFlipped?: boolean;
  /**
   * Perspective distance for 3D rotation in points.
   * Placed directly on the face layers to guarantee 3D depth rendering across Android and iOS.
   * @default 1000
   */
  perspective?: number;
  /**
   * Axis of 3D rotation.
   * - 'horizontal': spins around Y axis (`rotateY`)
   * - 'vertical': spins around X axis (`rotateX`)
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical';
  /**
   * Parabolic elevation height off the surface during the flip in points (positive lifts upward).
   * @default 22
   */
  liftHeight?: number;
  /**
   * Peak scale at the flip midpoint (progress = 0.5).
   * @default 1.08
   */
  peakScale?: number;
  /**
   * Spring physics configuration for the flip motion.
   * @default kinetics.spring.snap
   */
  springConfig?: WithSpringConfig;
  /**
   * Callback fired immediately when a flip starts.
   */
  onFlip?: (flipped: boolean) => void;
  /**
   * Callback fired when the flip spring completes settling.
   */
  onFlipComplete?: (flipped: boolean) => void;
  /**
   * Override reduced motion detection.
   */
  forceReducedMotion?: boolean;
}

export interface UseSpatialFlipReturn {
  /**
   * Animated style to apply to the front face component.
   * Includes perspective, rotation, opacity swapping at midpoint, and zIndex.
   */
  frontAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  /**
   * Animated style to apply to the back face component.
   * Includes perspective, rotation, opacity swapping at midpoint, and zIndex.
   */
  backAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  /**
   * Animated style to apply to the container wrapper.
   * Applies 2D parabolic lift (translateY) and peak scale.
   */
  containerAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  /**
   * Synchronous JS boolean representing whether the element is currently flipped (back facing).
   */
  isFlipped: boolean;
  /**
   * Shared value tracking flip progress (0 = front, 1 = back).
   */
  progress: SharedValue<number>;
  /**
   * Toggles the flipped state (uncontrolled mode, or triggers onFlip in controlled mode).
   */
  flip: () => void;
  /**
   * Sets the flipped state directly (uncontrolled mode).
   */
  setFlipped: (flipped: boolean | ((prev: boolean) => boolean)) => void;
}

export function useSpatialFlip(options: UseSpatialFlipOptions = {}): UseSpatialFlipReturn {
  const {
    flipped: controlledFlipped,
    initialFlipped = false,
    perspective = 1000,
    direction = 'horizontal',
    liftHeight = 22,
    peakScale = 1.08,
    springConfig = kinetics.spring.snap,
    onFlip,
    onFlipComplete,
    forceReducedMotion,
  } = options;

  const isControlled = controlledFlipped !== undefined;
  const [uncontrolledFlipped, setUncontrolledFlipped] = useState(initialFlipped);
  const effectiveFlipped = isControlled ? controlledFlipped : uncontrolledFlipped;

  const reducedMotionPref = useReducedMotion();
  const isReducedMotion = forceReducedMotion ?? (reducedMotionPref ?? false);

  const progress = useSharedValue(effectiveFlipped ? 1 : 0);
  const isMountedRef = useRef(false);
  const prevFlippedRef = useRef(effectiveFlipped);
  const callbacksRef = useRef({ onFlip, onFlipComplete, springConfig });

  useEffect(() => {
    callbacksRef.current = { onFlip, onFlipComplete, springConfig };
  });

  const animateTo = useCallback(
    (targetFlipped: boolean) => {
      const targetValue = targetFlipped ? 1 : 0;

      if (isReducedMotion) {
        progress.value = targetValue;
        callbacksRef.current.onFlipComplete?.(targetFlipped);
        return;
      }

      progress.value = withSpring(targetValue, callbacksRef.current.springConfig, (finished) => {
        'worklet';
        if (finished && callbacksRef.current.onFlipComplete) {
          runOnJS(callbacksRef.current.onFlipComplete)(targetValue === 1);
        }
      });
    },
    [isReducedMotion, progress],
  );

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      prevFlippedRef.current = effectiveFlipped;
      return;
    }
    if (prevFlippedRef.current !== effectiveFlipped) {
      prevFlippedRef.current = effectiveFlipped;
      animateTo(effectiveFlipped);
    }
  }, [effectiveFlipped, animateTo]);

  useEffect(() => {
    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  const flip = useCallback(() => {
    const next = !effectiveFlipped;
    callbacksRef.current.onFlip?.(next);
    if (!isControlled) {
      setUncontrolledFlipped(next);
    }
  }, [isControlled, effectiveFlipped]);

  const setFlipped = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      if (!isControlled) {
        setUncontrolledFlipped((prev) => {
          const resolved = typeof next === 'function' ? next(prev) : next;
          if (resolved !== prev) {
            callbacksRef.current.onFlip?.(resolved);
          }
          return resolved;
        });
      }
    },
    [isControlled],
  );

  const isHorizontal = direction === 'horizontal';

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rot = interpolate(progress.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    const opacity = progress.value > 0.5 ? 0 : 1;
    const transform = isHorizontal
      ? [{ perspective }, { rotateY: `${rot}deg` }]
      : [{ perspective }, { rotateX: `${rot}deg` }];

    return {
      transform,
      opacity,
      zIndex: progress.value < 0.5 ? 2 : 1,
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rot = interpolate(progress.value, [0, 1], [180, 360], Extrapolation.CLAMP);
    const opacity = progress.value <= 0.5 ? 0 : 1;
    const transform = isHorizontal
      ? [{ perspective }, { rotateY: `${rot}deg` }]
      : [{ perspective }, { rotateX: `${rot}deg` }];

    return {
      transform,
      opacity,
      zIndex: progress.value >= 0.5 ? 2 : 1,
      backfaceVisibility: 'hidden',
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const liftY = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, -liftHeight, 0],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [1, peakScale, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY: liftY }, { scale }],
    };
  });

  return {
    frontAnimatedStyle,
    backAnimatedStyle,
    containerAnimatedStyle,
    isFlipped: effectiveFlipped,
    progress,
    flip,
    setFlipped,
  };
}
