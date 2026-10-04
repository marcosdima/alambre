import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, useSharedValue, 
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
  const progress = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration });
  }, [isActive, duration]);

  const styleA = useAnimatedStyle(() => {
    const rotation = interpolate(progress.value, [0, 1], [0, 90]);
    const opacity = interpolate(progress.value, [0, 0.8], [1, 0], Extrapolation.CLAMP);
    const scale = interpolate(progress.value, [0, 1], [1, 0.5]);
    
    return {
      position: 'absolute',
      opacity,
      transform: [
        { rotate: `${rotation}deg` },
        { scale }
      ],
    };
  });

  const styleB = useAnimatedStyle(() => {
    const rotation = interpolate(progress.value, [0, 1], [-90, 0]);
    const opacity = interpolate(progress.value, [0.2, 1], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(progress.value, [0, 1], [0.5, 1]);

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
        <IconA size={size} color={color} drawIt={true} />
      </Animated.View>
      <Animated.View style={styleB}>
        <IconB size={size} color={color} drawIt={true} />
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
