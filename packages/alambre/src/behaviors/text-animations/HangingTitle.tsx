import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { kinetics } from '../../core/kinetics';

type LetterProps = {
  char: string;
  index: number;
  total: number;
  textColor: string;
  isLifted: boolean;
  textStyle?: StyleProp<TextStyle>;
};

const HangingLetter = memo(({ char, index, textColor, isLifted, textStyle }: LetterProps) => {
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
      <Animated.Text style={[styles.letter, { color: textColor }, textStyle]}>{char}</Animated.Text>
    </Animated.View>
  );
});

export type HangingTitleProps = {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  textColor?: string;
  subtitleColor?: string;
  textStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export function HangingTitle({
  title = 'Title',
  subtitle,
  onPress,
  textColor = '#000000',
  subtitleColor = '#666666',
  textStyle,
  subtitleStyle,
  style,
}: HangingTitleProps) {
  const [isLifted, setIsLifted] = useState(false);

  const chars = title.split('');

  const handlePress = () => {
    setIsLifted((prev) => !prev);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} style={[styles.container, style]}>
      <Text style={styles.hiddenText} accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants">{title}</Text>
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
            textColor={textColor}
            isLifted={isLifted}
            textStyle={textStyle}
          />
        ))}
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: subtitleColor }, subtitleStyle]}>{subtitle}</Text>
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
