import type { State, PosibleColor, AnimadoStyle } from '../../../types/animado';
import { StyleSheet } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

const filterTargets = (state: State) => {
  const flat = StyleSheet.flatten(state);
  const { backgroundColor, borderColor, color } = flat;
  return { backgroundColor, borderColor, color } as AnimadoStyle;
};

export default (initialState: State) => {
  const targets = filterTargets(initialState);

  const prevState = useSharedValue<AnimadoStyle>(targets);
  const nextState = useSharedValue(targets);
  const progress = useSharedValue(0);

  const defaultAnimation = (v: number) => withTiming(v, { duration: 300 });

  const animateTo = (
    setNextState: State,
    animation: (value: number) => number = defaultAnimation,
  ) => {
    prevState.value = nextState.value;
    nextState.value = filterTargets(setNextState);

    progress.value = 0;
    progress.value = animation(1);
  };

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

  return {
    animatedStyle,
    animateTo,
  };
};
