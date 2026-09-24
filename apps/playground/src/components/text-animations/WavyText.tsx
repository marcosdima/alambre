import { memo, useEffect } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';

export type WavyTextProps = {
  text: string;
  amplitude?: number;
  duration?: number;
  staggerMs?: number;
  active?: boolean;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

type WavyCharProps = {
  char: string;
  index: number;
  amplitude: number;
  duration: number;
  staggerMs: number;
  active: boolean;
  textStyle?: StyleProp<TextStyle>;
};

const WavyChar = memo(function WavyChar({
  char,
  index,
  amplitude,
  duration,
  staggerMs,
  active,
  textStyle,
}: WavyCharProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      translateY.value = withTiming(0, { duration: 150 });
      return;
    }

    const half = duration / 2;
    const delay = index * staggerMs;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-amplitude, { duration: half, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: half, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [active, amplitude, duration, index, staggerMs, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (char === ' ') {
    return (
      <Text style={[styles.baseText, textStyle, styles.space]}>
        {' '}
      </Text>
    );
  }

  return (
    <Animated.Text style={[styles.baseText, textStyle, animatedStyle]}>
      {char}
    </Animated.Text>
  );
});

export default function WavyText({
  text,
  amplitude = 7,
  duration = 600,
  staggerMs = 60,
  active = true,
  color,
  textStyle,
  containerStyle,
}: WavyTextProps) {
  const { theme } = useLightDark();
  const textColor = color ?? theme.color;
  const chars = text.split('');

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      style={[styles.container, containerStyle]}
    >
      {chars.map((char, index) => (
        <WavyChar
          key={`${char}-${index}`}
          char={char}
          index={index}
          amplitude={amplitude}
          duration={duration}
          staggerMs={staggerMs}
          active={active}
          textStyle={[{ color: textColor }, textStyle]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 6,
  },
  baseText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  space: {
    width: 6,
  },
});
