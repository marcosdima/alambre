import { useEffect, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';

export type MarqueeTextProps = {
  text: string;
  speed?: number; // Pixels per second, default 35
  initialDelay?: number; // ms to pause before starting, default 1200
  loopDelay?: number; // ms to pause between loops, default 1500
  spacing?: number; // gap between repeated text loops, default 40
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function MarqueeText({
  text,
  speed = 35,
  initialDelay = 1200,
  loopDelay = 1500,
  spacing = 40,
  color,
  textStyle,
  containerStyle,
}: MarqueeTextProps) {
  const { theme } = useLightDark();
  const isReducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [textWidth, setTextWidth] = useState<number | null>(null);

  const translateX = useSharedValue(0);
  const textColor = color ?? theme.color;

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const width = Math.round(e.nativeEvent.layout.width);
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const handleTextLayout = (e: LayoutChangeEvent) => {
    const width = Math.round(e.nativeEvent.layout.width);
    if (width > 0 && width !== textWidth) {
      setTextWidth(width);
    }
  };

  const shouldScroll =
    !isReducedMotion &&
    containerWidth !== null &&
    textWidth !== null &&
    textWidth > containerWidth;

  const scrollDistance = (textWidth ?? 0) + spacing;
  const scrollDuration = Math.max(1000, Math.round((scrollDistance / speed) * 1000));

  useEffect(() => {
    if (!shouldScroll) {
      cancelAnimation(translateX);
      translateX.value = 0;
      return;
    }

    translateX.value = 0;
    translateX.value = withDelay(
      initialDelay,
      withRepeat(
        withSequence(
          withTiming(-scrollDistance, {
            duration: scrollDuration,
            easing: Easing.linear,
          }),
          withTiming(0, { duration: 0 }),
          withDelay(loopDelay, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(translateX);
    };
  }, [
    shouldScroll,
    scrollDistance,
    scrollDuration,
    initialDelay,
    loopDelay,
    translateX,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      onLayout={handleContainerLayout}
      style={[styles.container, containerStyle]}
    >
      {/* Hidden off-screen text measuring target */}
      <View style={styles.measureBox} pointerEvents="none">
        <Text
          numberOfLines={1}
          onLayout={handleTextLayout}
          style={[styles.text, { color: textColor }, textStyle]}
        >
          {text}
        </Text>
      </View>

      {/* Render active content */}
      {shouldScroll ? (
        <Animated.View style={[styles.scrollRow, animatedStyle]}>
          <Text
            numberOfLines={1}
            style={[styles.text, { color: textColor }, textStyle]}
          >
            {text}
          </Text>
          <View style={{ width: spacing }} />
          <Text
            numberOfLines={1}
            style={[styles.text, { color: textColor }, textStyle]}
          >
            {text}
          </Text>
        </Animated.View>
      ) : (
        <Text
          numberOfLines={1}
          style={[styles.text, { color: textColor }, textStyle]}
        >
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
    justifyContent: 'center',
  },
  scrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  measureBox: {
    position: 'absolute',
    opacity: 0,
    top: -9999,
    left: -9999,
  },
});
