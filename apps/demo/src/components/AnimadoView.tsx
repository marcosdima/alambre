import type { ComponentProps, ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { ColorValue, StyleProp, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type AnimadoStyle = {
  backgroundColor?: ColorValue;
  borderColor?: ColorValue;
  color?: ColorValue;
};

type Animation = (value: number) => number;
type PosibleColor = ColorValue | undefined;
type AnimadoState = StyleProp<AnimadoStyle>;

type AnimadoProps = ComponentProps<typeof View> & ComponentProps<typeof Text> & {
  animation?: Animation;
  children?: ReactNode;
};

const filterTargets = (state: AnimadoState) => {
  const flat = StyleSheet.flatten(state);
  const { backgroundColor, borderColor, color } = flat;
  return { backgroundColor, borderColor, color } as AnimadoStyle;
};

export default ({ style, animation, children, ...props }: AnimadoProps) => {
  const targets = filterTargets(style);

  const prevState = useSharedValue<AnimadoStyle>(targets);
  const nextState = useSharedValue(targets);
  const progress = useSharedValue(0);

  const defaultAnimation = (v: number) => withTiming(v, { duration: 300 });

  const animateTo = (
    setNextState: AnimadoState,
    animation: (value: number) => number = defaultAnimation,
  ) => {
    prevState.value = nextState.value;
    nextState.value = filterTargets(setNextState);

    progress.value = 0;
    progress.value = animation(1);
  };

  useEffect(() => {
    animateTo(style, animation);
  }, [animateTo, animation, style]);

  const animatedStyle = useAnimatedStyle(() => {
    const from = prevState.value;
    const to = nextState.value;

    const interpolate = (
      from: PosibleColor = 'transparent',
      to: PosibleColor = 'transparent',
    ) => (
      interpolateColor(
        progress.value,
        [0, 1],
        [String(from), String(to)],
      )
    );

    return {
      backgroundColor: interpolate(from.backgroundColor, to.backgroundColor),
      borderColor: interpolate(from.borderColor, to.borderColor),
      color: interpolate(from.color, to.color),
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
};
