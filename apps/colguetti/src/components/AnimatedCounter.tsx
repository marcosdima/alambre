import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
  color: string;
  fontSize?: number;
};

export default function AnimatedCounter({
  value,
  suffix,
  color,
  fontSize = 20,
}: AnimatedCounterProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Punchy tactile spring bounce on value change
    scale.value = withSequence(
      withTiming(1.22, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 280 }),
    );
    translateY.value = withSequence(
      withTiming(-3, { duration: 80 }),
      withSpring(0, { damping: 14, stiffness: 300 }),
    );
  }, [value, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.numberBox, animatedStyle]}>
        <Text style={[styles.valueText, { color, fontSize }]}>{value}</Text>
      </Animated.View>
      {suffix ? (
        <Text style={[styles.suffixText, { color, fontSize: fontSize * 0.75 }]}>
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 5,
  },
  numberBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  suffixText: {
    fontWeight: '700',
    opacity: 0.85,
  },
});
