import { useEffect } from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useLightDark } from '../providers/theme';

export type AppProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  height?: number;
  indeterminate?: boolean;
  style?: StyleProp<ViewStyle>;
  trackStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export default function AppProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  tone = 'primary',
  height = 8,
  indeterminate = false,
  style,
  trackStyle,
  labelStyle,
}: AppProgressBarProps) {
  const { theme } = useLightDark();
  const isReducedMotion = useReducedMotion();

  const clampedRatio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const progress = useSharedValue(clampedRatio);
  const indeterminateTranslate = useSharedValue(-100);

  const toneColors = {
    primary: theme.primary,
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  const activeColor = toneColors[tone];

  // Animate progress width
  useEffect(() => {
    if (indeterminate) return;

    if (isReducedMotion) {
      progress.value = clampedRatio;
      return;
    }

    progress.value = withSpring(clampedRatio, {
      damping: 18,
      stiffness: 140,
      mass: 0.8,
    });
  }, [clampedRatio, isReducedMotion, indeterminate, progress]);

  // Indeterminate sliding loop
  useEffect(() => {
    if (!indeterminate || isReducedMotion) {
      cancelAnimation(indeterminateTranslate);
      indeterminateTranslate.value = -100;
      return;
    }

    indeterminateTranslate.value = -40;
    indeterminateTranslate.value = withRepeat(
      withSequence(
        withTiming(140, { duration: 1200, easing: Easing.inOut(Easing.cubic) }),
        withTiming(-40, { duration: 0 }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(indeterminateTranslate);
    };
  }, [indeterminate, isReducedMotion, indeterminateTranslate]);

  const fillAnimatedStyle = useAnimatedStyle(() => {
    if (indeterminate) {
      return {
        width: '40%',
        left: `${indeterminateTranslate.value}%`,
      };
    }
    return {
      width: `${progress.value * 100}%`,
      left: 0,
    };
  });

  const percentageText = `${Math.round(clampedRatio * 100)}%`;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? percentageText}
      accessibilityValue={
        indeterminate
          ? undefined
          : { min: 0, max, now: Math.round(value) }
      }
      style={[styles.container, style]}
    >
      {(label || showPercentage) ? (
        <View style={styles.labelRow}>
          {label ? (
            <Text
              style={[
                styles.labelText,
                { color: theme.color },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          ) : <View />}
          {showPercentage && !indeterminate ? (
            <Text
              style={[
                styles.percentageText,
                { color: activeColor },
                labelStyle,
              ]}
            >
              {percentageText}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.track,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: theme.surfaceAlt,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              borderRadius: height / 2,
              backgroundColor: activeColor,
            },
            fillAnimatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  track: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
  },
});
