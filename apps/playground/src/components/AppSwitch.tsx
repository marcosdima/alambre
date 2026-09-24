import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useLightDark } from '../providers/theme';

export type SwitchSize = 'sm' | 'md' | 'lg';
export type SwitchTone = 'primary' | 'success' | 'warning' | 'danger';

export type AppSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: SwitchSize;
  activeTone?: SwitchTone;
  label?: string;
  subtitle?: string;
  containerStyle?: StyleProp<ViewStyle>;
  switchStyle?: StyleProp<ViewStyle>;
};

export default function AppSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  activeTone = 'primary',
  label,
  subtitle,
  containerStyle,
  switchStyle,
}: AppSwitchProps) {
  const { theme } = useLightDark();

  const progress = useSharedValue(checked ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, {
      damping: 16,
      stiffness: 300,
    });
  }, [checked, progress]);

  const getToneColor = () => {
    switch (activeTone) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'danger':
        return '#ef4444';
      case 'primary':
      default:
        return theme.primary;
    }
  };

  const activeColor = getToneColor();

  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return {
          trackWidth: 38,
          trackHeight: 22,
          thumbSize: 16,
          pad: 3,
          borderRadius: 11,
          maxOffset: 38 - 16 - 6,
        };
      case 'lg':
        return {
          trackWidth: 56,
          trackHeight: 34,
          thumbSize: 26,
          pad: 4,
          borderRadius: 17,
          maxOffset: 56 - 26 - 8,
        };
      case 'md':
      default:
        return {
          trackWidth: 48,
          trackHeight: 28,
          thumbSize: 20,
          pad: 4,
          borderRadius: 14,
          maxOffset: 48 - 20 - 8,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  const handlePressIn = () => {
    if (disabled) return;
    pressScale.value = withTiming(1.15, { duration: 80 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    pressScale.value = withSpring(1, { damping: 14, stiffness: 320 });
  };

  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  const animatedTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [theme.surfaceAlt, activeColor],
    );
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      [theme.border, activeColor],
    );

    return {
      backgroundColor,
      borderColor,
    };
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    const translateX = progress.value * sizeConfig.maxOffset;

    return {
      transform: [
        { translateX },
        { scaleX: pressScale.value },
      ],
    };
  });

  const switchElement = (
    <Pressable
      onPress={handleToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      hitSlop={8}
      style={[disabled && styles.disabled, switchStyle]}
    >
      <Animated.View
        style={[
          styles.track,
          animatedTrackStyle,
          {
            width: sizeConfig.trackWidth,
            height: sizeConfig.trackHeight,
            borderRadius: sizeConfig.borderRadius,
            padding: sizeConfig.pad,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            animatedThumbStyle,
            {
              width: sizeConfig.thumbSize,
              height: sizeConfig.thumbSize,
              borderRadius: sizeConfig.thumbSize / 2,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );

  if (!label && !subtitle) {
    return switchElement;
  }

  return (
    <Pressable
      onPress={handleToggle}
      disabled={disabled}
      style={[styles.rowContainer, disabled && styles.disabled, containerStyle]}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
    >
      <View style={styles.textContainer}>
        {label ? (
          <Text style={[styles.label, { color: theme.color }]}>{label}</Text>
        ) : null}
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {switchElement}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  thumb: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 3,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 4,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  disabled: {
    opacity: 0.45,
  },
});
