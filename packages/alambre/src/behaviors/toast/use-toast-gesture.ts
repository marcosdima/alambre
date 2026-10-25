import { useEffect, useState } from 'react';
import {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { kinetics } from '../../core/kinetics';
import { parseToastPayload } from './toast-types';
import type { Toast, ToastPosition } from './toast-types';

export type UseToastGestureOptions<TPayload = unknown> = {
  toast: Toast<TPayload>;
  dismiss: (id?: string) => void;
  position?: ToastPosition;
  topOffset?: number;
  bottomOffset?: number;
  duration?: number;
  horizontalThreshold?: number;
  verticalThreshold?: number;
};

export function useToastGesture<TPayload = unknown>({
  toast,
  dismiss,
  position,
  topOffset = 16,
  bottomOffset = 16,
  duration,
  horizontalThreshold = 85,
  verticalThreshold = 35,
}: UseToastGestureOptions<TPayload>) {
  const { data } = toast;
  const parsed = parseToastPayload(data.payload);
  const isTop = (position ?? parsed.position) !== 'bottom';
  const targetOffset = isTop ? topOffset : bottomOffset;

  const animatedOffset = useSharedValue(targetOffset);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const progressWidth = useSharedValue(100);
  const [isGestureDismissed, setIsGestureDismissed] = useState(false);

  useEffect(() => {
    animatedOffset.value = withTiming(targetOffset, kinetics.timing.base);
  }, [targetOffset, animatedOffset]);

  // Progress countdown animation
  useEffect(() => {
    if (data.persistent || data.actions?.length) return;
    progressWidth.value = 100;
    const finalDuration = duration ?? data.duration ?? 4000;
    progressWidth.value = withTiming(0, {
      duration: finalDuration,
      easing: Easing.linear,
    });
  }, [data.id, data.duration, data.persistent, data.actions, duration, progressWidth]);

  // Reset transforms on id change
  useEffect(() => {
    setIsGestureDismissed(false);
    translateX.value = 0;
    translateY.value = 0;
  }, [data.id, translateX, translateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      if (isTop) {
        translateY.value = event.translationY < 0 ? event.translationY : event.translationY * 0.2;
      } else {
        translateY.value = event.translationY > 0 ? event.translationY : event.translationY * 0.2;
      }
    })
    .onEnd((event) => {
      const dismissUp = isTop && (event.translationY < -verticalThreshold || event.velocityY < -350);
      const dismissDown = !isTop && (event.translationY > verticalThreshold || event.velocityY > 350);
      const dismissHoriz = Math.abs(event.translationX) > horizontalThreshold || Math.abs(event.velocityX) > 600;

      if (dismissUp) {
        runOnJS(setIsGestureDismissed)(true);
        translateY.value = withTiming(-160, kinetics.timing.base, () => {
          runOnJS(dismiss)(data.id);
        });
      } else if (dismissDown) {
        runOnJS(setIsGestureDismissed)(true);
        translateY.value = withTiming(160, kinetics.timing.base, () => {
          runOnJS(dismiss)(data.id);
        });
      } else if (dismissHoriz) {
        runOnJS(setIsGestureDismissed)(true);
        const dir = Math.sign(event.translationX || event.velocityX || 1);
        translateX.value = withTiming(dir * 500, kinetics.timing.base, () => {
          runOnJS(dismiss)(data.id);
        });
      } else {
        translateX.value = withSpring(0, kinetics.spring.snappy);
        translateY.value = withSpring(0, kinetics.spring.snappy);
      }
    });

  const animatedPositionStyle = useAnimatedStyle(() => {
    if (isTop) {
      return { top: animatedOffset.value };
    }
    return { bottom: animatedOffset.value };
  });

  const animatedGestureStyle = useAnimatedStyle(() => {
    const dragDist = Math.max(Math.abs(translateX.value), Math.abs(translateY.value));
    const opacity = interpolate(
      dragDist,
      [0, 60, 220],
      [1, 0.85, 0],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      opacity,
    };
  });

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const showProgressBar = !data.persistent && (!data.actions || data.actions.length === 0);

  return {
    isTop,
    isGestureDismissed,
    showProgressBar,
    panGesture,
    animatedOffset,
    translateX,
    translateY,
    progressWidth,
    animatedPositionStyle,
    animatedGestureStyle,
    progressBarStyle,
  };
}
