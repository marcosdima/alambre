import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

export type BottomSheetSpringConfig = {
  damping?: number;
  stiffness?: number;
  mass?: number;
};

import { kinetics } from '../../core/kinetics';


export type UseBottomSheetOptions = {
  visible: boolean;
  onClose: () => void;
  springConfig?: BottomSheetSpringConfig;
  initialTranslateY?: number;
};

export function useBottomSheet({
  visible,
  onClose,
  springConfig,
  initialTranslateY = 420,
}: UseBottomSheetOptions) {
  const [isMounted, setIsMounted] = useState(visible);
  const isFirstRender = useRef(true);

  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(initialTranslateY);

  const damping = springConfig?.damping ?? kinetics.spring.snappy.damping;
  const stiffness = springConfig?.stiffness ?? kinetics.spring.snappy.stiffness;
  const mass = springConfig?.mass ?? kinetics.spring.snappy.mass;

  const resolvedSpring = useMemo(
    () => ({ damping, stiffness, mass }),
    [damping, stiffness, mass],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!visible) return;
    }

    if (visible) {
      setIsMounted(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, resolvedSpring);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      translateY.value = withSpring(initialTranslateY + 30, resolvedSpring, (finished) => {
        if (finished) {
          runOnJS(setIsMounted)(false);
        }
      });
    }
  }, [visible, backdropOpacity, translateY, resolvedSpring, initialTranslateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      } else {
        // Soft resistance when dragging upward with a safe clamp (-45px)
        translateY.value = Math.max(-45, kinetics.friction.rubberBand(event.translationY, 0.12));
      }
    })
    .onEnd((event) => {
      if (event.translationY > 70 || event.velocityY > 500) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, resolvedSpring);
      }
    });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    const dragFade = interpolate(
      translateY.value,
      [0, 300],
      [1, 0.2],
      Extrapolation.CLAMP,
    );
    return {
      opacity: backdropOpacity.value * dragFade,
    };
  });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const snapTo = (value: number) => {
    translateY.value = withSpring(value, resolvedSpring);
  };

  return {
    isMounted,
    panGesture,
    translateY,
    backdropOpacity,
    animatedBackdropStyle,
    animatedSheetStyle,
    close: onClose,
    snapTo,
  };
}
