import React, { useEffect } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, useReducedMotion } from 'react-native-reanimated';
import { kinetics } from '../../core/kinetics';

export type DropInTitleProps = {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  fontFamily?: string;
};

export function DropInTitle({ text, textStyle, style, fontFamily }: DropInTitleProps) {
  const letters = text.split('');

  return (
    <View
      style={[styles.row, style]}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={text}
    >
      {letters.map((char, index) => (
        <AnimatedLetter key={`${index}-${char}`} char={char} index={index} textStyle={textStyle} fontFamily={fontFamily} />
      ))}
    </View>
  );
}

function AnimatedLetter({
  char,
  index,
  textStyle,
  fontFamily,
}: {
  char: string;
  index: number;
  textStyle?: StyleProp<TextStyle>;
  fontFamily?: string;
}) {
  const isReducedMotion = useReducedMotion();
  const translateY = useSharedValue(isReducedMotion ? 0 : -50);
  const opacity = useSharedValue(isReducedMotion ? 1 : 0);

  useEffect(() => {
    if (isReducedMotion) {
      translateY.value = 0;
      opacity.value = 1;
      return;
    }
    translateY.value = withDelay(index * 60, withSpring(0, kinetics.spring.bouncy));
    opacity.value = withDelay(index * 60, withSpring(1));
  }, [index, opacity, translateY, isReducedMotion]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[textStyle, fontFamily ? { fontFamily } : null, style]} importantForAccessibility="no-hide-descendants">
      {char === ' ' ? ' ' : char}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
});
