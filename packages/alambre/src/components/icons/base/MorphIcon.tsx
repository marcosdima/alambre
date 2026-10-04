import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  interpolate, 
  Extrapolation,
  withTiming
} from 'react-native-reanimated';
import type { IconProps } from '../../../types/icons';

export interface MorphIconProps extends IconProps {
  IconA: React.ComponentType<any>;
  IconB: React.ComponentType<any>;
  isActive: boolean;
  onPress?: () => void;
  size?: number;
  color?: string;
  duration?: number;
}

export function MorphIcon({
  IconA,
  IconB,
  isActive,
  onPress,
  size = 24,
  color = 'currentColor',
  duration = 400,
  style,
}: MorphIconProps) {
  // We use a simple 0 to 1 progress
  const progress = isActive ? 1 : 0;

  // Icon A rotates out and fades out
  const styleA = useAnimatedStyle(() => {
    const rotation = withTiming(isActive ? 90 : 0, { duration });
    const opacity = withTiming(isActive ? 0 : 1, { duration: duration * 0.8 });
    const scale = withTiming(isActive ? 0.5 : 1, { duration });
    return {
      position: 'absolute',
      opacity,
      transform: [
        { rotate: `${rotation}deg` },
        { scale }
      ],
    };
  });

  // Icon B rotates in and fades in
  const styleB = useAnimatedStyle(() => {
    const rotation = withTiming(isActive ? 0 : -90, { duration });
    const opacity = withTiming(isActive ? 1 : 0, { duration: duration * 0.8 });
    const scale = withTiming(isActive ? 1 : 0.5, { duration });
    return {
      position: 'absolute',
      opacity,
      transform: [
        { rotate: `${rotation}deg` },
        { scale }
      ],
    };
  });

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper 
      onPress={onPress} 
      style={[styles.container, { width: size, height: size }, style]}
      accessibilityRole={onPress ? "button" : "image"}
      accessibilityState={{ checked: isActive }}
    >
      <Animated.View style={styleA}>
        <IconA size={size} color={color} />
      </Animated.View>
      <Animated.View style={styleB}>
        <IconB size={size} color={color} />
      </Animated.View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});
