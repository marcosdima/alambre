import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { kinetics } from '../core/kinetics';

export interface UsePressKineticsOptions {
  /**
   * Scale factor applied when the element is pressed down.
   * @default 0.96
   */
  activeScale?: number;
  /**
   * Opacity factor applied when the element is pressed down.
   * @default 1
   */
  activeOpacity?: number;
  /**
   * Translation Y in points when pressed (tactile 3D depress effect).
   * @default 0
   */
  activeTranslateY?: number;
  /**
   * General spring physics configuration (used as fallback for both press-in and press-out).
   */
  springConfig?: WithSpringConfig;
  /**
   * Spring physics applied on press down (touch down).
   * @default springConfig ?? kinetics.spring.responsive
   */
  pressInSpringConfig?: WithSpringConfig;
  /**
   * Spring physics applied on press release (bounce back).
   * @default springConfig ?? kinetics.spring.bouncy
   */
  pressOutSpringConfig?: WithSpringConfig;
  /**
   * Whether interaction is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Respects reduced motion (snaps scale/opacity instantly without delay or oscillations).
   * @default false
   */
  forceReducedMotion?: boolean;
  /**
   * Whether to synchronize React state `pressed`. Default `false` to avoid JS re-renders.
   * @default false
   */
  trackState?: boolean;
  /**
   * Optional callback fired on press down for tactile haptic feedback.
   * Keeps alambre decoupled from specific native haptic modules.
   */
  hapticFeedback?: () => void;
  /**
   * Optional callback when press starts.
   */
  onPressIn?: ((event: GestureResponderEvent) => void) | null;
  /**
   * Optional callback when press ends.
   */
  onPressOut?: ((event: GestureResponderEvent) => void) | null;
  /**
   * Optional callback on press release.
   */
  onPress?: ((event: GestureResponderEvent) => void) | null;
  /**
   * Optional callback on long press.
   */
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
}

export interface UsePressKineticsReturn {
  /**
   * Spreadable handlers for `<Pressable {...pressProps}>`.
   */
  pressProps: {
    onPressIn: (event: GestureResponderEvent) => void;
    onPressOut: (event: GestureResponderEvent) => void;
    onPress?: ((event: GestureResponderEvent) => void) | null;
    onLongPress?: ((event: GestureResponderEvent) => void) | null;
    disabled?: boolean;
  };
  /**
   * Animated style to apply to `<Animated.View style={animatedStyle}>` or `<AnimatedPressable style={animatedStyle}>`.
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /**
   * Shared value tracking animated press progress (0 = unpressed, 1 = pressed).
   */
  progress: SharedValue<number>;
  /**
   * Alias for `progress` for backwards compatibility.
   */
  isPressed: SharedValue<number>;
  /**
   * Synchronous JS boolean representing active press state (only updated if `trackState: true`).
   */
  pressed: boolean;
}

/**
 * Universal headless tactile interaction hook.
 *
 * Provides instant 60/120 FPS UI-thread touch feedback (spring scale, depress translation,
 * clamped opacity) with asymmetric physics (immediate responsive press-in, bouncy tactile release)
 * and zero JS thread re-render overhead.
 */
export function usePressKinetics({
  activeScale = 0.96,
  activeOpacity = 1,
  activeTranslateY = 0,
  springConfig,
  pressInSpringConfig,
  pressOutSpringConfig,
  disabled = false,
  forceReducedMotion = false,
  trackState = false,
  hapticFeedback,
  onPressIn,
  onPressOut,
  onPress,
  onLongPress,
}: UsePressKineticsOptions = {}): UsePressKineticsReturn {
  const systemReducedMotion = useReducedMotion();
  const isReduced = Boolean(forceReducedMotion || systemReducedMotion);

  const progress = useSharedValue(0);
  const [pressed, setPressed] = useState(false);

  const inConfig = pressInSpringConfig ?? springConfig ?? kinetics.spring.responsive;
  const outConfig = pressOutSpringConfig ?? springConfig ?? kinetics.spring.bouncy;

  // Keep user callbacks in a ref to preserve reference identity of handlers
  const callbacksRef = useRef({
    hapticFeedback,
    onPressIn,
    onPressOut,
    onPress,
    onLongPress,
  });
  callbacksRef.current = {
    hapticFeedback,
    onPressIn,
    onPressOut,
    onPress,
    onLongPress,
  };

  // Disabled synchronization: if disabled changes while pressed down, spring back to 0
  useEffect(() => {
    if (disabled && progress.value !== 0) {
      if (trackState) setPressed(false);
      progress.value = isReduced ? 0 : withSpring(0, outConfig);
    }
  }, [disabled, isReduced, outConfig, progress, trackState]);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;
      if (trackState) setPressed(true);

      callbacksRef.current.hapticFeedback?.();
      callbacksRef.current.onPressIn?.(event);

      if (isReduced) {
        progress.value = 1;
      } else {
        progress.value = withSpring(1, inConfig);
      }
    },
    [disabled, trackState, isReduced, inConfig, progress],
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;
      if (trackState) setPressed(false);

      callbacksRef.current.onPressOut?.(event);

      if (isReduced) {
        progress.value = 0;
      } else {
        progress.value = withSpring(0, outConfig);
      }
    },
    [disabled, trackState, isReduced, outConfig, progress],
  );

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;
      callbacksRef.current.onPress?.(event);
    },
    [disabled],
  );

  const handleLongPress = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;
      callbacksRef.current.onLongPress?.(event);
    },
    [disabled],
  );

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const scale = 1 + p * (activeScale - 1);
    const translateY = p * activeTranslateY;
    // Clamping opacity prevents native driver errors during spring overshoot
    const opacity = Math.min(1, Math.max(0, 1 + p * (activeOpacity - 1)));

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  }, [activeScale, activeOpacity, activeTranslateY]);

  const pressProps = useMemo(() => {
    const props: UsePressKineticsReturn['pressProps'] = {
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
    };
    if (onPress !== undefined) {
      props.onPress = handlePress;
    }
    if (onLongPress !== undefined) {
      props.onLongPress = handleLongPress;
    }
    if (disabled !== undefined) {
      props.disabled = disabled;
    }
    return props;
  }, [handlePressIn, handlePressOut, handlePress, handleLongPress, onPress, onLongPress, disabled]);

  return useMemo(
    () => ({
      pressProps,
      animatedStyle,
      progress,
      isPressed: progress,
      pressed,
    }),
    [pressProps, animatedStyle, progress, pressed],
  );
}
