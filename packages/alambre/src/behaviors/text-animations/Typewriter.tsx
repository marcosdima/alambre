import React, { useEffect } from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export interface TypewriterProps extends Omit<TextInputProps, 'value' | 'editable'> {
  text: string;
  duration?: number;
  delay?: number;
  speed?: number;
}

export function Typewriter({ text, duration = 2000, delay = 0, speed = 1, style, ...props }: TypewriterProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(text.length, {
        duration: duration / Math.max(0.1, speed),
        easing: Easing.linear,
      }),
    );
  }, [text, duration, delay, speed, progress]);

  const animatedProps = useAnimatedProps(() => {
    const currentLength = Math.floor(progress.value);
    return {
      text: text.substring(0, currentLength),
    };
  });

  return (
    <AnimatedTextInput
      {...props}
      animatedProps={animatedProps as Partial<TextInputProps>}
      editable={false}
      style={[styles.text, style]}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#000',
  },
});
