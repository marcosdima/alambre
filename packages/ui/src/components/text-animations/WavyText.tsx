import { memo, useEffect, useMemo } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { kinetics } from 'alambre';

export type WavyTextProps = {
  text: string;
  mode?: 'char' | 'word';
  amplitude?: number;
  duration?: number;
  staggerMs?: number;
  active?: boolean;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

type WavyUnitProps = {
  content: string;
  index: number;
  amplitude: number;
  duration: number;
  staggerMs: number;
  active: boolean;
  isReducedMotion: boolean;
  textStyle?: StyleProp<TextStyle>;
};

const WavyUnit = memo(function WavyUnit({
  content,
  index,
  amplitude,
  duration,
  staggerMs,
  active,
  isReducedMotion,
  textStyle,
}: WavyUnitProps) {
  const progress = useSharedValue(0);
  const animAmplitude = useSharedValue(amplitude);

  // Smoothly update amplitude without disrupting running wave phase
  useEffect(() => {
    animAmplitude.value = withTiming(amplitude, kinetics.timing.base);
  }, [amplitude, animAmplitude]);

  // Wave oscillation driver - strictly independent from amplitude
  useEffect(() => {
    if (!active || isReducedMotion) {
      progress.value = withTiming(0, kinetics.timing.base);
      return;
    }

    const half = duration / 2;
    const delay = index * staggerMs;

    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: half, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: half, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [active, duration, index, staggerMs, progress, isReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * animAmplitude.value }],
  }));

  return (
    <Animated.Text style={[styles.baseText, textStyle, animatedStyle]}>
      {content}
    </Animated.Text>
  );
});

export default function WavyText({
  text,
  mode = 'char',
  amplitude = 7,
  duration = 600,
  staggerMs = 60,
  active = true,
  color,
  textStyle,
  containerStyle,
}: WavyTextProps) {
  const { theme } = useTheme();
  const isReducedMotion = useReducedMotion();
  const textColor = color ?? theme.color;

  // Split into words so flexWrap wraps on whole word boundaries
  const words = useMemo(() => text.split(' '), [text]);

  let charOffset = 0;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      style={[styles.container, containerStyle]}
    >
      {words.map((word, wordIndex) => {
        if (mode === 'word') {
          return (
            <View key={`word-${wordIndex}`} style={styles.wordGroup}>
              <WavyUnit
                content={word}
                index={wordIndex}
                amplitude={amplitude}
                duration={duration}
                staggerMs={staggerMs}
                active={active}
                isReducedMotion={isReducedMotion}
                textStyle={[{ color: textColor }, textStyle]}
              />
              {wordIndex < words.length - 1 ? (
                <Text
                  style={[
                    styles.baseText,
                    { color: textColor },
                    textStyle,
                    styles.space,
                  ]}
                >
                  {' '}
                </Text>
              ) : null}
            </View>
          );
        }

        const chars = word.split('');
        const startIndex = charOffset;
        charOffset += chars.length + 1; // +1 for the space

        return (
          <View key={`word-${wordIndex}`} style={styles.wordGroup}>
            {chars.map((char, charIdx) => {
              const globalIndex = startIndex + charIdx;
              return (
                <WavyUnit
                  key={`char-${globalIndex}`}
                  content={char}
                  index={globalIndex}
                  amplitude={amplitude}
                  duration={duration}
                  staggerMs={staggerMs}
                  active={active}
                  isReducedMotion={isReducedMotion}
                  textStyle={[{ color: textColor }, textStyle]}
                />
              );
            })}
            {wordIndex < words.length - 1 ? (
              <Text
                style={[
                  styles.baseText,
                  { color: textColor },
                  textStyle,
                  styles.space,
                ]}
              >
                {' '}
              </Text>
            ) : null}
          </View>
        );
      })}
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
  wordGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
