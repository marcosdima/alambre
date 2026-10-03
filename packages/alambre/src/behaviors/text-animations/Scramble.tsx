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

export interface ScrambleProps extends Omit<TextInputProps, 'value' | 'editable'> {
  text: string;
  duration?: number;
  delay?: number;
  speed?: number;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

export function Scramble({ text, duration = 2000, delay = 0, speed = 1, style, ...props }: ScrambleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: duration / Math.max(0.1, speed),
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [text, duration, delay, speed, progress]);

  const animatedProps = useAnimatedProps(() => {
    const p = progress.value;
    const revealCount = Math.floor(p * text.length);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') {
        result += ' ';
      } else if (i < revealCount) {
        result += text[i];
      } else {
        const randIndex = Math.floor(Math.random() * CHARS.length);
        result += CHARS[randIndex];
      }
    }
    return {
      text: result,
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
