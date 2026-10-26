import React from 'react';
import {
  StyleSheet,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useLoopClock, wrapPhase } from '../../hooks/use-loop-clock';
import { useTheme } from '../theme';

export type SkeletonVariant = 'text' | 'rect' | 'circle' | 'pill';

export interface AppSkeletonProps {
  /** Visual shape of the skeleton placeholder. @default 'rect' */
  variant?: SkeletonVariant;
  /** Width dimension in points or percentage string. */
  width?: DimensionValue;
  /** Height dimension in points or percentage string. */
  height?: DimensionValue;
  /** Explicit border radius override in points. */
  radius?: number;
  /** Custom container style overrides. */
  style?: StyleProp<ViewStyle>;
  /** Whether the pulsing animation is active. @default true */
  active?: boolean;
  /** Animation duration in milliseconds for the shared loop clock. @default 1200 */
  duration?: number;
  /** Accessible label announced by screen readers. @default 'Loading content' */
  accessibilityLabel?: string;
}

/**
 * Accessible, tactile skeleton loader driven by a single-clock loop.
 *
 * All instances of `AppSkeleton` on screen read from a unified `useLoopClock` frame,
 * guaranteeing $O(1)$ animation overhead without micro-timer spam on the UI thread.
 * Automatically respects `ReducedMotion` / `isStatic` by rendering a clean static placeholder.
 */
export default function AppSkeleton({
  variant = 'rect',
  width,
  height,
  radius,
  style,
  active = true,
  duration = 1200,
  accessibilityLabel = 'Loading content',
}: AppSkeletonProps) {
  const { theme } = useTheme();
  const { clock, isStatic } = useLoopClock({
    duration: Math.max(200, duration),
    paused: !active,
  });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    if (isStatic || !active) {
      return { opacity: 0.5 };
    }
    const phase = wrapPhase(clock.value);
    // Smooth sinusoidal breathing between 0.38 and 0.85 opacity
    const pulse = 0.38 + 0.47 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2 - Math.PI / 2));
    return { opacity: pulse };
  });

  const getVariantStyles = (): {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
  } => {
    switch (variant) {
      case 'circle': {
        const size = width ?? height ?? 44;
        return {
          width: size,
          height: size,
          borderRadius: 999,
        };
      }
      case 'pill':
        return {
          width: width ?? '100%',
          height: height ?? 32,
          borderRadius: 999,
        };
      case 'text':
        return {
          width: width ?? '100%',
          height: height ?? 14,
          borderRadius: radius ?? 6,
        };
      case 'rect':
      default:
        return {
          width: width ?? '100%',
          height: height ?? 48,
          borderRadius: radius ?? 12,
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.skeleton,
        {
          backgroundColor: theme.surfaceAlt,
          borderColor: theme.border,
        },
        variantStyle,
        style,
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
