import React, { useEffect, useState } from 'react';
import type { TextProps, TextStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export interface CountUpProps extends Omit<TextProps, 'style'> {
  value: number;
  initialValue?: number;
  duration?: number;
  delay?: number;
  speed?: number;
  style?: StyleProp<TextStyle>;
}

const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface TickProps extends Omit<TextProps, 'style'> {
  digit: string;
  height: number;
  duration: number;
  delay: number;
  speed: number;
  style?: StyleProp<TextStyle>;
}

function Tick({ digit, height, style, duration, delay, speed, ...textProps }: TickProps) {
  const isNumber = !isNaN(Number(digit)) && digit !== ' ' && digit !== '.' && digit !== '-' && digit !== ',';
  const numericValue = isNumber ? Number(digit) : 0;

  const animatedValue = useSharedValue(0);

  useEffect(() => {
    const dur = duration / Math.max(0.1, speed);
    animatedValue.value = withDelay(
      delay,
      withTiming(numericValue, {
        duration: dur,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [numericValue, duration, delay, speed, animatedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: -animatedValue.value * height },
      ],
    };
  });

  if (!isNumber) {
    return (
      <View style={{ height, justifyContent: 'center' }}>
        <Text {...textProps} style={[style, { height, lineHeight: height }]}>{digit}</Text>
      </View>
    );
  }

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.View style={animatedStyle}>
        {NUMBERS.map((num) => (
          <Text key={num} {...textProps} style={[style, { height, lineHeight: height }]}>
            {num}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export function CountUp({
  value,
  initialValue: _initialValue = 0,
  duration = 1000,
  delay = 0,
  speed = 1,
  style,
  ...props
}: CountUpProps) {
  const [height, setHeight] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    if (height === 0) {
      setHeight(e.nativeEvent.layout.height);
    }
  };

  const strValue = value.toString();
  const parts = strValue.split('.');
  const intPart = parts[0];
  const decPart = parts.length > 1 ? '.' + parts[1] : '';

  const renderTick = (char: string, key: string) => (
    <Tick
      key={key}
      digit={char}
      height={height}
      style={[styles.text, style, { fontVariant: ['tabular-nums'] }]}
      duration={duration}
      delay={delay}
      speed={speed}
      {...props}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.text, style, styles.hidden]} onLayout={handleLayout} pointerEvents="none">
        0
      </Text>
      {height > 0 && (
        <React.Fragment>
          {intPart.split('').map((char, index) => renderTick(char, `int-${intPart.length - index}`))}
          {decPart.split('').map((char, index) => renderTick(char, `dec-${index}`))}
        </React.Fragment>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    color: '#000',
  },
  hidden: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
  },
});
