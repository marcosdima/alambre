import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { kinetics } from '../../core/kinetics';

export interface WavyTextProps {
  text: string;
  amplitude?: number;
  gap?: number;
  staggerDelay?: number;
  speed?: number;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export function WavyText({
  text,
  amplitude = 10,
  gap = 2,
  staggerDelay = 50,
  speed = 1,
  style,
  containerStyle,
}: WavyTextProps) {
  const chars = text.split('');

  return (
    <View style={[styles.container, containerStyle, { gap }]}>
      {chars.map((char, index) => {
        return (
          <WavyChar
            key={`${index}-${char}`}
            char={char}
            index={index}
            amplitude={amplitude}
            staggerDelay={staggerDelay}
            speed={speed}
            style={style}
          />
        );
      })}
    </View>
  );
}

function WavyChar({ char, index, amplitude, staggerDelay, speed, style }: { char: string; index: number; amplitude: number; staggerDelay: number; speed: number; style?: any }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * staggerDelay,
      withRepeat(
        withSequence(
          withTiming(-amplitude, { duration: 500 / Math.max(0.1, speed) }),
          withTiming(amplitude, { duration: 500 / Math.max(0.1, speed) }),
        ),
        -1,
        true,
      ),
    );
  }, [amplitude, staggerDelay, speed, index, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <AnimatedText style={[style, animatedStyle]}>
      {char === ' ' ? ' ' : char}
    </AnimatedText>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
