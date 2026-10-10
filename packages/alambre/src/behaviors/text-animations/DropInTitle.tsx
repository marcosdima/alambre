import React, { useEffect } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { kinetics } from '../../core/kinetics';

export type DropInTitleProps = {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export function DropInTitle({ text, textStyle, style }: DropInTitleProps) {
  const letters = text.split('');

  return (
    <View
      style={[styles.row, style]}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={text}
    >
      {letters.map((char, index) => (
        <AnimatedLetter key={`${index}-${char}`} char={char} index={index} textStyle={textStyle} />
      ))}
    </View>
  );
}

function AnimatedLetter({ char, index, textStyle }: { char: string, index: number, textStyle?: StyleProp<TextStyle> }) {
  const translateY = useSharedValue(-50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(index * 60, withSpring(0, kinetics.spring.bouncy));
    opacity.value = withDelay(index * 60, withSpring(1));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[textStyle, style]} importantForAccessibility="no-hide-descendants">
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
