import AppText from './AppText';
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet,  View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { kinetics } from 'alambre';
import { useLightDark } from '../providers/theme';

type LetterProps = {
  char: string;
  index: number;
  total: number;
  textColor: string;
  isLifted: boolean;
};

const HangingLetter = memo(({ char, index, textColor, isLifted }: LetterProps) => {
  const liftY = useSharedValue(0);
  const staticRot = (index % 2 === 0 ? 1 : -1) * (1.5 + (index % 3) * 0.8);

  // Toggle lift on tap (staggered wave up on tap, lowers back down on second tap)
  useEffect(() => {
    const delay = index * 25;
    liftY.value = withDelay(
      delay,
      withSpring(isLifted ? -12 : 0, kinetics.spring.snappy),
    );
  }, [isLifted, index, liftY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: liftY.value },
      { rotate: `${staticRot}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.letterContainer, animatedStyle]}>
      <AppText style={[styles.letter, { color: textColor }]}>{char}</AppText>
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
  const [isLifted, setIsLifted] = useState(false);

  const chars = title.split('');

  const handlePress = () => {
    setIsLifted((prev) => !prev);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <AppText style={styles.hiddenText}>{title}</AppText>
      <View
        style={styles.wordRow}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel={title}
      >
        {chars.map((char, idx) => (
          <HangingLetter
            key={`char-${idx}-${char}`}
            char={char}
            index={idx}
            total={chars.length}
            textColor={theme.color}
            isLifted={isLifted}
          />
        ))}
      </View>
      {subtitle ? (
        <AppText style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hiddenText: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
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
    
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    
    marginTop: 4,
    opacity: 0.9,
  },
});
