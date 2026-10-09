import AppText from './AppText';
import React, { useEffect } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useConfig } from '../providers/config';

export default function DropInTitle({ text, textStyle }: { text: string; textStyle?: StyleProp<TextStyle> }) {
  const letters = text.split('');

  return (
    <View style={styles.row}>
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
    translateY.value = withDelay(index * 60, withSpring(0, { damping: 14, stiffness: 200 }));
    opacity.value = withDelay(index * 60, withSpring(1));
  }, [index, opacity, translateY]);

  const { config } = useConfig();
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[textStyle, style, { fontFamily: config.fontFamily }]}>
      {char === ' ' ? '\u00A0' : char}
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
