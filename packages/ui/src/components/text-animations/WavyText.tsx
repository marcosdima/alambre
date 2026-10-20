import { memo, useMemo } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { resolveTypography, useTheme } from '../../theme';
import { harmonicValue, useLoopClock, wrapPhase } from 'alambre';

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
  clock: SharedValue<number>;
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
  clock,
  textStyle,
}: WavyUnitProps) {
  const phaseStep = staggerMs / Math.max(1, duration);

  const animatedStyle = useAnimatedStyle(() => {
    if (isReducedMotion || !active) {
      return { transform: [{ translateY: 0 }] };
    }
    const charPhase = wrapPhase(clock.value - index * phaseStep);
    // swell: 0 -> amplitude -> 0 on the UI thread
    const y = -harmonicValue('swell', charPhase, amplitude);
    return {
      transform: [{ translateY: y }],
    };
  });

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
  const { clock, isStatic } = useLoopClock({
    duration: Math.max(100, duration),
    paused: !active,
  });
  const textColor = color ?? theme.color;
  const typo = resolveTypography(theme.fontFamily, 'heavy');

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
                isReducedMotion={isStatic}
                clock={clock}
                textStyle={[typo, { color: textColor }, textStyle]}
              />
              {wordIndex < words.length - 1 ? (
                <Text
                  style={[
                    styles.baseText,
                    typo,
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
                  isReducedMotion={isStatic}
                  clock={clock}
                  textStyle={[typo, { color: textColor }, textStyle]}
                />
              );
            })}

            {wordIndex < words.length - 1 ? (
              <Text
                style={[
                  styles.baseText,
                  typo,
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
    letterSpacing: -0.3,
  },
  space: {
    width: 6,
  },
});
