import { useEffect } from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { kinetics } from '../../../../core/kinetics';

export type SwitchSize = 'sm' | 'md' | 'lg';

export type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: SwitchSize;
  activeColor?: string;
  inactiveColor?: string;
  activeBorderColor?: string;
  inactiveBorderColor?: string;
  thumbColor?: string;
  label?: string;
  subtitle?: string;
  labelStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  switchStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

export default function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  activeColor = '#2563eb',
  inactiveColor = '#e5e7eb',
  activeBorderColor,
  inactiveBorderColor,
  thumbColor = '#ffffff',
  label,
  subtitle,
  labelStyle,
  subtitleStyle,
  containerStyle,
  switchStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: SwitchProps) {
  const progress = useSharedValue(checked ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, kinetics.spring.stiff);
  }, [checked, progress]);

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
    pressScale.value = withTiming(1.15, kinetics.timing.fast);
  };

  const handlePressOut = () => {
    if (disabled) return;
    pressScale.value = withSpring(1, kinetics.spring.stiff);
  };

  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  const animatedTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor],
    );
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      [inactiveBorderColor ?? inactiveColor, activeBorderColor ?? activeColor],
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

  const trackView = (
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
          { backgroundColor: thumbColor },
          animatedThumbStyle,
          {
            width: sizeConfig.thumbSize,
            height: sizeConfig.thumbSize,
            borderRadius: sizeConfig.thumbSize / 2,
          },
        ]}
      />
    </Animated.View>
  );

  if (!label && !subtitle) {
    return (
      <Pressable
        onPress={handleToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ checked, disabled }}
        testID={testID}
        hitSlop={8}
        style={[disabled && styles.disabled, switchStyle]}
      >
        {trackView}
      </Pressable>
    );
  }

  const computedA11yLabel = accessibilityLabel ?? (subtitle ? `${label}, ${subtitle}` : label);

  return (
    <Pressable
      onPress={handleToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.rowContainer, disabled && styles.disabled, containerStyle]}
      accessibilityRole="switch"
      accessibilityLabel={computedA11yLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked, disabled }}
      testID={testID}
    >
      <View style={styles.textContainer}>
        {label ? (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        ) : null}
        {subtitle ? (
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        ) : null}
      </View>
      <View pointerEvents="none" style={switchStyle} accessible={false} aria-hidden={true}>
        {trackView}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  thumb: {
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
    flexShrink: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  disabled: {
    opacity: 0.45,
  },
});
