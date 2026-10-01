import { useEffect, useRef, useState } from 'react';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type UseDialogOptions = {
  visible: boolean;
  onClose?: () => void;
  initialScale?: number;
};

export function useDialog({
  visible,
  onClose,
  initialScale = 0.92,
}: UseDialogOptions) {
  const [isMounted, setIsMounted] = useState(visible);
  const isFirstRender = useRef(true);

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(initialScale);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!visible) return;
    }

    if (visible) {
      setIsMounted(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      cardScale.value = withSpring(1, { damping: 18, stiffness: 300 });
      cardOpacity.value = withTiming(1, { duration: 180 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 160 });
      cardScale.value = withTiming(initialScale, { duration: 160 });
      cardOpacity.value = withTiming(0, { duration: 160 }, (finished) => {
        if (finished) {
          runOnJS(setIsMounted)(false);
        }
      });
    }
  }, [visible, backdropOpacity, cardScale, cardOpacity, initialScale]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const close = () => {
    if (onClose) onClose();
  };

  return {
    isMounted,
    animatedBackdropStyle,
    animatedCardStyle,
    backdropOpacity,
    cardScale,
    cardOpacity,
    close,
  };
}
