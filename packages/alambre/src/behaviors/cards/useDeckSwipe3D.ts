import { useState, useCallback, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import type {
  UseDeckSwipe3DConfig,
  UseDeckSwipe3DReturn,
  DeckSwipe3DTelemetry,
} from './types';

export function useDeckSwipe3D<T>(
  config: UseDeckSwipe3DConfig<T>,
): UseDeckSwipe3DReturn<T> {
  const {
    initialCards,
    threshold = 110,
    stiffness = 260,
    damping = 34,
    maxTilt = 22,
    dismissDuration = 180,
    onDismiss: onDismissCallback,
  } = config;

  const [cards, setCards] = useState<T[]>(() => [...initialCards]);
  const [history, setHistory] = useState<T[]>([]);
  const [isDismissing, setIsDismissing] = useState(false);

  const [telemetry, setTelemetry] = useState<DeckSwipe3DTelemetry>({
    lastAction: 'Ready',
    swipeDx: 0,
    swipeDy: 0,
    direction: 'None',
  });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scaleShared = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const isDismissingShared = useSharedValue(false);
  const dismissFallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean dismiss finalizer: runs once card is fully off-screen
  const finalizeDismiss = useCallback(
    (direction: 'left' | 'right' | 'up') => {
      if (dismissFallbackTimer.current) {
        clearTimeout(dismissFallbackTimer.current);
        dismissFallbackTimer.current = null;
      }

      setCards((prev) => {
        if (prev.length === 0) return prev;
        const [swiped, ...rest] = prev;
        setHistory((hist) => [swiped, ...hist]);

        onDismissCallback?.(direction, swiped);

        setTelemetry({
          lastAction: `Dismissed (${direction})`,
          swipeDx: 0,
          swipeDy: 0,
          direction,
        });

        return rest;
      });

      translateX.value = 0;
      translateY.value = 0;
      scaleShared.value = 1;
      isDismissingShared.value = false;
      setIsDismissing(false);
    },
    [translateX, translateY, scaleShared, isDismissingShared, onDismissCallback],
  );

  // Trigger dismissal animation: snappy withTiming (~180ms) avoids underdamped freeze
  const triggerDismiss = useCallback(
    (direction: 'left' | 'right' | 'up', initialVelocity = 0) => {
      if (cards.length === 0 || isDismissingShared.value) return;
      isDismissingShared.value = true;
      setIsDismissing(true);

      const targetX = direction === 'right' ? 520 : direction === 'left' ? -520 : 0;
      const targetY = direction === 'up' ? -550 : 0;

      // Snappy duration between 140ms and 220ms based on fling speed
      const duration = Math.max(
        140,
        Math.min(220, Math.round((dismissDuration * 2000) / (Math.abs(initialVelocity) + 1400))),
      );

      const onFinish = () => {
        'worklet';
        runOnJS(finalizeDismiss)(direction);
      };

      if (direction === 'up') {
        translateY.value = withTiming(
          targetY,
          { duration, easing: Easing.bezier(0.2, 0, 0, 1) },
          (finished) => {
            'worklet';
            if (finished) onFinish();
          },
        );
      } else {
        translateX.value = withTiming(
          targetX,
          { duration, easing: Easing.bezier(0.2, 0, 0, 1) },
          (finished) => {
            'worklet';
            if (finished) onFinish();
          },
        );
      }

      // Hard timeout fallback so it is physically impossible to get stuck
      if (dismissFallbackTimer.current) clearTimeout(dismissFallbackTimer.current);
      dismissFallbackTimer.current = setTimeout(() => {
        if (isDismissingShared.value) {
          finalizeDismiss(direction);
        }
      }, duration + 60);
    },
    [cards.length, isDismissingShared, finalizeDismiss, translateX, translateY, dismissDuration],
  );

  const updateSnapBack = useCallback(() => {
    setTelemetry((prev) => ({
      ...prev,
      lastAction: 'Snapped back to center',
      swipeDx: 0,
      swipeDy: 0,
      direction: 'Center',
    }));
  }, []);

  // Pan gesture: stable memoized handler, worklet-only dragging (no JS bridge flood)
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .onStart(() => {
        'worklet';
        if (isDismissingShared.value) return;
        isDragging.value = true;
        scaleShared.value = withSpring(1.04, { stiffness: 320, damping: 28 });
      })
      .onUpdate((e) => {
        'worklet';
        if (isDismissingShared.value) return;
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      })
      .onEnd((e) => {
        'worklet';
        if (isDismissingShared.value) return;
        isDragging.value = false;
        scaleShared.value = withSpring(1.0, { stiffness: 320, damping: 28 });

        const tx = e.translationX;
        const ty = e.translationY;
        const vx = e.velocityX;
        const vy = e.velocityY;

        // 1. Upward Super-Boost flick
        if (ty < -threshold || vy < -600) {
          runOnJS(triggerDismiss)('up', vy);
          return;
        }

        // 2. Right Keep flick
        if (tx > threshold || vx > 600) {
          runOnJS(triggerDismiss)('right', vx);
          return;
        }

        // 3. Left Pass flick
        if (tx < -threshold || vx < -600) {
          runOnJS(triggerDismiss)('left', vx);
          return;
        }

        // 4. Elastic snap-back to origin
        translateX.value = withSpring(0, { stiffness, damping });
        translateY.value = withSpring(0, { stiffness, damping });
        runOnJS(updateSnapBack)();
      });
  }, [
    isDismissingShared,
    isDragging,
    scaleShared,
    translateX,
    translateY,
    threshold,
    stiffness,
    damping,
    triggerDismiss,
    updateSnapBack,
  ]);

  // Top Card: Authentic 3D spatial transforms
  const topCardStyle = useAnimatedStyle(() => {
    const rotZ = interpolate(translateX.value, [-220, 220], [-14, 14], Extrapolation.CLAMP);
    const rotY = interpolate(translateX.value, [-220, 220], [-maxTilt, maxTilt], Extrapolation.CLAMP);
    const rotX = interpolate(translateY.value, [-220, 220], [maxTilt * 0.75, -maxTilt * 0.75], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective: 1000 },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotZ}deg` },
        { rotateY: `${rotY}deg` },
        { rotateX: `${rotX}deg` },
        { scale: scaleShared.value },
      ],
      zIndex: 10,
    };
  });

  // Specular sheen overlay that highlights card as it tilts in 3D
  const sheenStyle = useAnimatedStyle(() => {
    const tiltNorm = Math.min(1, Math.abs(translateX.value) / 180);
    return {
      opacity: interpolate(tiltNorm, [0, 1], [0, 0.16]),
    };
  });

  // Second Card: Dynamically scales up and rises as top card is dragged away
  const secondCardStyle = useAnimatedStyle(() => {
    const dragDistance = Math.sqrt(
      translateX.value * translateX.value + translateY.value * translateY.value,
    );
    const progress = interpolate(dragDistance, [0, threshold * 1.2], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(progress, [0, 1], [0.93, 1.0]);
    const translateYOffset = interpolate(progress, [0, 1], [14, 0]);
    const opacity = interpolate(progress, [0, 1], [0.84, 1.0]);

    return {
      transform: [
        { perspective: 1000 },
        { translateY: translateYOffset },
        { scale },
      ],
      opacity,
      zIndex: 5,
    };
  });

  // Third Card: Subtle depth transition
  const thirdCardStyle = useAnimatedStyle(() => {
    const dragDistance = Math.sqrt(
      translateX.value * translateX.value + translateY.value * translateY.value,
    );
    const progress = interpolate(dragDistance, [0, threshold * 1.2], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(progress, [0, 1], [0.86, 0.93]);
    const translateYOffset = interpolate(progress, [0, 1], [26, 14]);
    const opacity = interpolate(progress, [0, 1], [0.55, 0.84]);

    return {
      transform: [
        { perspective: 1000 },
        { translateY: translateYOffset },
        { scale },
      ],
      opacity,
      zIndex: 2,
    };
  });

  // Dynamic directional badge opacities & scale
  const rightBadgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [25, threshold], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(translateX.value, [25, threshold], [0.85, 1.05], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ rotate: '-12deg' }, { scale }],
    };
  });

  const leftBadgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-25, -threshold], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(translateX.value, [-25, -threshold], [0.85, 1.05], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ rotate: '12deg' }, { scale }],
    };
  });

  const upBadgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateY.value, [-25, -threshold], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(translateY.value, [-25, -threshold], [0.85, 1.05], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Fluid Undo: Restored card enters from off-screen with natural spring
  const undo = useCallback(() => {
    if (history.length === 0 || isDismissingShared.value) return;
    const [lastSwiped, ...remainingHistory] = history;
    setHistory(remainingHistory);
    setCards((prev) => [lastSwiped, ...prev]);

    translateX.value = -380;
    translateY.value = 0;
    translateX.value = withSpring(0, { stiffness, damping });
    setTelemetry((prev) => ({
      ...prev,
      lastAction: 'Restored previous card',
      swipeDx: 0,
      swipeDy: 0,
      direction: 'Restored',
    }));
  }, [history, isDismissingShared, stiffness, damping, translateX, translateY]);

  // Reset entire deck
  const reset = useCallback(() => {
    if (dismissFallbackTimer.current) {
      clearTimeout(dismissFallbackTimer.current);
      dismissFallbackTimer.current = null;
    }
    setCards([...initialCards]);
    setHistory([]);
    translateX.value = 0;
    translateY.value = 0;
    scaleShared.value = 1;
    isDismissingShared.value = false;
    setIsDismissing(false);
    setTelemetry({
      lastAction: 'Deck reset',
      swipeDx: 0,
      swipeDy: 0,
      direction: 'Reset',
    });
  }, [translateX, translateY, scaleShared, isDismissingShared, initialCards]);

  const topCard = cards[0];
  const secondCard = cards[1];
  const thirdCard = cards[2];

  return {
    cards,
    history,
    topCard,
    secondCard,
    thirdCard,
    isDismissing,
    panGesture,
    topCardStyle,
    secondCardStyle,
    thirdCardStyle,
    sheenStyle,
    rightBadgeStyle,
    leftBadgeStyle,
    upBadgeStyle,
    telemetry,
    triggerDismiss,
    undo,
    reset,
  };
}
