import React, { useEffect, useState } from 'react';
import type { LayoutChangeEvent, ViewProps } from 'react-native';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

export interface MarqueeProps extends ViewProps {
  children: React.ReactNode;
  duration?: number;
  gap?: number;
  speed?: number;
}

export function Marquee({ children, duration = 5000, gap = 50, speed = 1, style, ...props }: MarqueeProps) {
  const [contentWidth, setContentWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (contentWidth > 0) {
      translateX.value = 0;
      translateX.value = withRepeat(
        withTiming(-contentWidth - gap, {
          duration: duration / Math.max(0.1, speed),
          easing: Easing.linear,
        }),
        -1, // infinite
        false, // no reverse
      );
    }
  }, [contentWidth, gap, duration, speed, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setContentWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.container, style]} {...props}>
      <Animated.View style={[styles.row, animatedStyle]}>
        <View onLayout={onLayout} style={styles.content}>
          {children}
        </View>
        {contentWidth > 0 && (
          <View style={[styles.content, { marginLeft: gap }]}>
            {children}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
  },
});
