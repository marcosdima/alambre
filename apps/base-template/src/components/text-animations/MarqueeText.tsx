import { useEffect, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
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
  forceScroll?: boolean;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  onLayoutMetrics?: (metrics: {
    containerWidth: number;
    textWidth: number;
    shouldScroll: boolean;
  }) => void;
};

export default function MarqueeText({
  text,
  speed = 35,
  initialDelay = 800,
  loopDelay = 1200,
  spacing = 40,
  color,
  forceScroll = false,
  textStyle,
  containerStyle,
  onLayoutMetrics,
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

  const shouldScroll =
    !isReducedMotion &&
    (forceScroll ||
      (containerWidth !== null &&
        textWidth !== null &&
        textWidth > containerWidth));

  const effectiveTextWidth = textWidth ?? Math.max(containerWidth ?? 300, text.length * 9);
  const scrollDistance = Math.ceil(effectiveTextWidth + spacing);
  const scrollDuration = Math.max(800, Math.round((scrollDistance / Math.max(1, speed)) * 1000));

  useEffect(() => {
    if (containerWidth !== null && textWidth !== null) {
      onLayoutMetrics?.({
        containerWidth,
        textWidth,
        shouldScroll,
      });
    }
  }, [containerWidth, textWidth, shouldScroll, onLayoutMetrics]);

  useEffect(() => {
    if (!shouldScroll) {
      cancelAnimation(translateX);
      translateX.value = 0;
      return;
    }

    translateX.value = 0;

    const scrollAnim = withTiming(-scrollDistance, {
      duration: scrollDuration,
      easing: Easing.linear,
    });

    const cycleAnimation = loopDelay > 0
      ? withDelay(loopDelay, scrollAnim)
      : scrollAnim;

    translateX.value = withDelay(
      initialDelay,
      withRepeat(cycleAnimation, -1, false),
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
      {/* Hidden horizontal scroll probe for unconstrained text width measuring */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        pointerEvents="none"
        style={styles.hiddenProbe}
        onContentSizeChange={(width) => {
          const w = Math.ceil(width) + 8;
          if (w > 0 && w !== textWidth) {
            setTextWidth(w);
          }
        }}
      >
        <Text style={[styles.text, textStyle, { flexShrink: 0 }]}>
          {text}
        </Text>
      </ScrollView>

      {/* Render active scrolling content */}
      {shouldScroll ? (
        <Animated.View
          style={[
            styles.scrollRow,
            animatedStyle,
            { width: (scrollDistance * 2) + 40 },
          ]}
        >
          <Text
            numberOfLines={1}
            ellipsizeMode="clip"
            style={[
              styles.text,
              {
                color: textColor,
                width: effectiveTextWidth,
                flexShrink: 0,
              },
              textStyle,
            ]}
          >
            {text}
          </Text>
          <View style={{ width: spacing, flexShrink: 0 }} />
          <Text
            numberOfLines={1}
            ellipsizeMode="clip"
            style={[
              styles.text,
              {
                color: textColor,
                width: effectiveTextWidth,
                flexShrink: 0,
              },
              textStyle,
            ]}
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
  hiddenProbe: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    zIndex: -1,
  },
});
