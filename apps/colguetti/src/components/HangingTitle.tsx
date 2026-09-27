import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useLightDark } from '../providers/theme';

type LetterProps = {
  char: string;
  index: number;
  total: number;
  textColor: string;
  bounceTrigger: number;
};

const HangingLetter = memo(({ char, index, textColor, bounceTrigger }: LetterProps) => {
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Subtle hanging oscillation
  useEffect(() => {
    const delay = index * 75;
    const maxRot = (index % 2 === 0 ? 1 : -1) * (3.5 + (index % 3) * 1.5);

    rotation.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(maxRot, { duration: 1200 + index * 80, easing: Easing.inOut(Easing.quad) }),
          withTiming(-maxRot, { duration: 1200 + index * 80, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-2.5, { duration: 1100 + index * 60, easing: Easing.inOut(Easing.quad) }),
          withTiming(2, { duration: 1100 + index * 60, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [index, rotation, translateY]);

  // Touch bounce
  useEffect(() => {
    if (bounceTrigger === 0) return;
    const delay = index * 35;
    translateY.value = withDelay(
      delay,
      withSequence(
        withSpring(-10, { damping: 10, stiffness: 350 }),
        withSpring(0, { damping: 12, stiffness: 250 }),
      ),
    );
  }, [bounceTrigger, index, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.letterContainer, animatedStyle]}>
      <Text style={[styles.letter, { color: textColor }]}>{char}</Text>
    </Animated.View>
  );
});

type HangingTitleProps = {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
};

export default function HangingTitle({
  title = 'Colguetti',
  subtitle,
  onPress,
}: HangingTitleProps) {
  const { theme } = useLightDark();
  const bounceTrigger = useSharedValue(0);

  const chars = title.split('');

  const handlePress = () => {
    bounceTrigger.value = Date.now();
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={styles.wordRow}>
        {chars.map((char, idx) => (
          <HangingLetter
            key={`char-${idx}-${char}`}
            char={char}
            index={idx}
            total={chars.length}
            textColor={theme.color}
            bounceTrigger={bounceTrigger.value}
          />
        ))}
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  letterContainer: {
    paddingHorizontal: 0.5,
  },
  letter: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.9,
  },
});
