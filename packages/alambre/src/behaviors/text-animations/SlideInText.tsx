import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { kinetics } from '../../core/kinetics';

export interface SlideInTextProps {
  text: string;
  offset?: number;
  staggerDelay?: number;
  mode?: 'words' | 'characters';
  gap?: number;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export function SlideInText({
  text,
  offset = 20,
  staggerDelay = 50,
  mode = 'characters',
  gap = 4,
  style,
  containerStyle,
}: SlideInTextProps) {
  const items = mode === 'words' ? text.split(' ') : text.split('');

  return (
    <View style={[styles.container, containerStyle, { gap: mode === 'words' ? gap : 0 }]}>
      {items.map((item, index) => {
        return (
          <SlideInItem
            key={`${index}-${item}`}
            item={item}
            index={index}
            offset={offset}
            staggerDelay={staggerDelay}
            mode={mode}
            style={style}
          />
        );
      })}
    </View>
  );
}

function SlideInItem({ item, index, offset, staggerDelay, mode, style }: { item: string; index: number; offset: number; staggerDelay: number; mode: string; style?: any }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      index * staggerDelay,
      withSpring(1, kinetics.spring.bouncy),
    );
  }, [offset, staggerDelay, index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [
        {
          translateY: interpolate(progress.value, [0, 1], [offset, 0]),
        },
      ],
    };
  });

  return (
    <AnimatedText style={[style, animatedStyle]}>
      {mode === 'characters' && item === ' ' ? ' ' : item}
    </AnimatedText>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
