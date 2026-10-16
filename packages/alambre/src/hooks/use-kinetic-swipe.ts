import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  type GestureResponderHandlers,
} from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  cancelAnimation,
  useReducedMotion,
  type SharedValue,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { kinetics } from '../core/kinetics';
import { calculateSwipeTilt } from '../core/spatial';

export type KineticSwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface UseKineticSwipeOptions {
  /** Distance in points needed to trigger dismiss when dragging. @default 120 */
  threshold?: number;
  /** Velocity in points/second to trigger a flick dismissal even if threshold distance isn't reached. @default 800 */
  escapeVelocity?: number;
  /** Maximum tilt angle in degrees when dragging horizontally. @default 14 */
  tiltAngle?: number;
  /** Allowed swipe directions. @default ['left', 'right'] */
  directions?: KineticSwipeDirection[];
  /** Spring configuration for snapping back when not dismissed. @default kinetics.spring.responsive */
  springConfig?: WithSpringConfig;
  /** Distance off-screen to animate during dismissal in points. @default 600 */
  dismissDistance?: number;
  /** Duration of dismiss animation in ms. @default 260 */
  dismissDuration?: number;
  /** Whether swiping interaction is disabled. @default false */
  disabled?: boolean;
  /** Force reduced motion (snaps without oscillations). */
  forceReducedMotion?: boolean;
  /** Fired when dismiss threshold or escape velocity is triggered (start of exit animation). */
  onDismissStart?: (direction: KineticSwipeDirection) => void;
  /** Fired when dismiss animation has fully settled and element is safe to unmount. */
  onDismiss?: (direction: KineticSwipeDirection) => void;
  /** Fired when element snaps back to rest position (0, 0). */
  onSnapBack?: () => void;
  /** Fired on drag start. */
  onDragStart?: () => void;
  /** Fired on drag end before physics decision. */
  onDragEnd?: () => void;
}

export interface UseKineticSwipeReturn {
  /**
   * Reanimated UI-thread Pan gesture for `<GestureDetector gesture={gesture}>`.
   * Delivers 120 FPS performance with zero JS-bridge overhead.
   */
  gesture: ReturnType<typeof Gesture.Pan>;
  /**
   * Standard React Native PanResponder handlers for `<View {...panHandlers}>`.
   * Universal fallback for environments without GestureHandlerRootView.
   */
  panHandlers: GestureResponderHandlers;
  /**
   * Animated style to spread or attach to `<Animated.View style={animatedStyle}>`.
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /**
   * Raw shared values for translation.
   */
  translation: {
    x: SharedValue<number>;
    y: SharedValue<number>;
  };
  /**
   * Shared value tracking whether the element is actively being dragged.
   */
  isDragging: SharedValue<boolean>;
  /**
   * Programmatic dismiss in a given direction.
   */
  dismiss: (direction?: KineticSwipeDirection) => void;
  /**
   * Programmatic reset back to origin (0, 0).
   */
  reset: () => void;
  /**
   * Synchronous JS boolean indicating whether element has dismissed.
   */
  isDismissed: boolean;
  /**
   * Shared value indicating whether element has dismissed.
   */
  isDismissedShared: SharedValue<boolean>;
}

export function useKineticSwipe(
  options: UseKineticSwipeOptions = {},
): UseKineticSwipeReturn {
  const {
    threshold = 120,
    escapeVelocity = 800,
    tiltAngle = 14,
    directions = ['left', 'right'],
    springConfig = kinetics.spring.responsive ?? kinetics.spring.snap,
    dismissDistance = 600,
    dismissDuration = 260,
    disabled = false,
    forceReducedMotion = false,
    onDismissStart,
    onDismiss,
    onSnapBack,
    onDragStart,
    onDragEnd,
  } = options;

  const systemReducedMotion = useReducedMotion();
  const isReducedMotion = forceReducedMotion || Boolean(systemReducedMotion);

  const [isDismissed, setIsDismissed] = useState(false);
  const isDismissedShared = useSharedValue(false);
  const isDragging = useSharedValue(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const optionsRef = useRef({
    threshold,
    escapeVelocity,
    tiltAngle,
    directions,
    springConfig,
    dismissDistance,
    dismissDuration,
    disabled,
    isReducedMotion,
    onDismissStart,
    onDismiss,
    onSnapBack,
    onDragStart,
    onDragEnd,
  });

  useEffect(() => {
    optionsRef.current = {
      threshold,
      escapeVelocity,
      tiltAngle,
      directions,
      springConfig,
      dismissDistance,
      dismissDuration,
      disabled,
      isReducedMotion,
      onDismissStart,
      onDismiss,
      onSnapBack,
      onDragStart,
      onDragEnd,
    };
  }, [
    threshold,
    escapeVelocity,
    tiltAngle,
    directions,
    springConfig,
    dismissDistance,
    dismissDuration,
    disabled,
    isReducedMotion,
    onDismissStart,
    onDismiss,
    onSnapBack,
    onDragStart,
    onDragEnd,
  ]);

  // Clean unmount safety
  useEffect(() => {
    return () => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
    };
  }, [translateX, translateY]);

  const handleDismissFinished = useCallback((dir: KineticSwipeDirection) => {
    setIsDismissed(true);
    optionsRef.current.onDismiss?.(dir);
  }, []);

  const handleSnapBackFinished = useCallback(() => {
    optionsRef.current.onSnapBack?.();
  }, []);

  const triggerDismiss = useCallback(
    (dir: KineticSwipeDirection = 'right') => {
      isDismissedShared.value = true;
      optionsRef.current.onDismissStart?.(dir);

      let targetX = 0;
      let targetY = 0;
      if (dir === 'right') targetX = optionsRef.current.dismissDistance;
      else if (dir === 'left') targetX = -optionsRef.current.dismissDistance;
      else if (dir === 'down') targetY = optionsRef.current.dismissDistance;
      else if (dir === 'up') targetY = -optionsRef.current.dismissDistance;

      if (optionsRef.current.isReducedMotion) {
        translateX.value = targetX;
        translateY.value = targetY;
        handleDismissFinished(dir);
        return;
      }

      const duration = optionsRef.current.dismissDuration;
      translateX.value = withTiming(targetX, { duration }, (finished) => {
        if (finished && (dir === 'left' || dir === 'right')) {
          runOnJS(handleDismissFinished)(dir);
        }
      });
      translateY.value = withTiming(targetY, { duration }, (finished) => {
        if (finished && (dir === 'up' || dir === 'down')) {
          runOnJS(handleDismissFinished)(dir);
        }
      });
    },
    [handleDismissFinished, isDismissedShared, translateX, translateY],
  );

  const triggerSnapBack = useCallback(() => {
    if (optionsRef.current.isReducedMotion) {
      translateX.value = 0;
      translateY.value = 0;
      handleSnapBackFinished();
      return;
    }

    const springConf = optionsRef.current.springConfig;
    translateX.value = withSpring(0, springConf, (finished) => {
      if (finished) {
        runOnJS(handleSnapBackFinished)();
      }
    });
    translateY.value = withSpring(0, springConf);
  }, [handleSnapBackFinished, translateX, translateY]);

  const reset = useCallback(() => {
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    translateX.value = 0;
    translateY.value = 0;
    isDismissedShared.value = false;
    setIsDismissed(false);
  }, [isDismissedShared, translateX, translateY]);

  const handleDragStartJS = useCallback(() => {
    optionsRef.current.onDragStart?.();
  }, []);

  const handleDragEndJS = useCallback(() => {
    optionsRef.current.onDragEnd?.();
  }, []);

  // Dual Gesture 1: Gesture.Pan (UI-thread, zero JS latency)
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(!disabled)
      .onStart(() => {
        'worklet';
        if (isDismissedShared.value) return;
        isDragging.value = true;
        startX.value = translateX.value;
        startY.value = translateY.value;
        runOnJS(handleDragStartJS)();
      })
      .onUpdate((event) => {
        'worklet';
        if (isDismissedShared.value) return;
        translateX.value = startX.value + event.translationX;
        translateY.value = startY.value + event.translationY;
      })
      .onEnd((event) => {
        'worklet';
        if (isDismissedShared.value) return;
        isDragging.value = false;
        runOnJS(handleDragEndJS)();

        const tx = translateX.value;
        const ty = translateY.value;
        const vx = event.velocityX;
        const vy = event.velocityY;
        const dirs = directions;
        const thresh = threshold;
        const escVel = escapeVelocity;

        let decided: KineticSwipeDirection | null = null;
        if (dirs.includes('right') && (tx >= thresh || vx >= escVel)) {
          decided = 'right';
        } else if (dirs.includes('left') && (tx <= -thresh || vx <= -escVel)) {
          decided = 'left';
        } else if (dirs.includes('down') && (ty >= thresh || vy >= escVel)) {
          decided = 'down';
        } else if (dirs.includes('up') && (ty <= -thresh || vy <= -escVel)) {
          decided = 'up';
        }

        if (decided) {
          runOnJS(triggerDismiss)(decided);
        } else {
          runOnJS(triggerSnapBack)();
        }
      });
  }, [
    disabled,
    threshold,
    escapeVelocity,
    directions,
    isDismissedShared,
    isDragging,
    startX,
    startY,
    translateX,
    translateY,
    triggerDismiss,
    triggerSnapBack,
    handleDragStartJS,
    handleDragEndJS,
  ]);

  // Dual Gesture 2: PanResponder (Universal fallback for bare React Native)
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !optionsRef.current.disabled && !isDismissedShared.value,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (optionsRef.current.disabled || isDismissedShared.value) return false;
        return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
      },
      onPanResponderGrant: () => {
        if (isDismissedShared.value) return;
        isDragging.value = true;
        startX.value = translateX.value;
        startY.value = translateY.value;
        optionsRef.current.onDragStart?.();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isDismissedShared.value) return;
        translateX.value = startX.value + gestureState.dx;
        translateY.value = startY.value + gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isDismissedShared.value) return;
        isDragging.value = false;
        optionsRef.current.onDragEnd?.();

        const tx = translateX.value;
        const ty = translateY.value;
        const vx = gestureState.vx * 1000;
        const vy = gestureState.vy * 1000;
        const dirs = optionsRef.current.directions;
        const thresh = optionsRef.current.threshold;
        const escVel = optionsRef.current.escapeVelocity;

        let decided: KineticSwipeDirection | null = null;
        if (dirs.includes('right') && (tx >= thresh || vx >= escVel)) {
          decided = 'right';
        } else if (dirs.includes('left') && (tx <= -thresh || vx <= -escVel)) {
          decided = 'left';
        } else if (dirs.includes('down') && (ty >= thresh || vy >= escVel)) {
          decided = 'down';
        } else if (dirs.includes('up') && (ty <= -thresh || vy <= -escVel)) {
          decided = 'up';
        }

        if (decided) {
          triggerDismiss(decided);
        } else {
          triggerSnapBack();
        }
      },
      onPanResponderTerminate: () => {
        isDragging.value = false;
        triggerSnapBack();
      },
    });
  }, [isDismissedShared, isDragging, startX, startY, translateX, translateY, triggerDismiss, triggerSnapBack]);

  const animatedStyle = useAnimatedStyle(() => {
    const tilt = calculateSwipeTilt(translateX.value, tiltAngle);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${tilt}deg` },
      ],
    };
  }, [tiltAngle]);

  return {
    gesture: panGesture,
    panHandlers: panResponder.panHandlers,
    animatedStyle,
    translation: {
      x: translateX,
      y: translateY,
    },
    isDragging,
    dismiss: triggerDismiss,
    reset,
    isDismissed,
    isDismissedShared,
  };
}
