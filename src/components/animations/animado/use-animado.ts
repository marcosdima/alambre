import type { SharedValue } from 'react-native-reanimated';
import type { State, PosibleColor } from '../../../types/animado';
import { StyleSheet } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

export default (initialState: State) => {
  const flat = StyleSheet.flatten(initialState);

  const prevState = useSharedValue(flat);
  const nextState = useSharedValue(flat);
  const progress = useSharedValue(0);

  const defaultAnimation = (v: number) => withTiming(v, { duration: 300 });

  const animateTo = (
    setNextState: State,
    animation: (value: number) => number = defaultAnimation,
  ) => {
    prevState.value = nextState.value;
    nextState.value = StyleSheet.flatten(setNextState);

    progress.value = 0;
    progress.value = animation(1);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const from = prevState.value;
    const to = nextState.value;

    const getInterpolateColor = (
      shared: SharedValue<number>,
      from: PosibleColor,
      to: PosibleColor,
    ) => (
      interpolateColor(
        shared.value,
        [0, 1],
        [
          String(from),
          String(to),
        ],
      )
    );

    return {
      ...to,
      backgroundColor: getInterpolateColor(progress, from.backgroundColor, to.backgroundColor),
      borderColor: getInterpolateColor(progress, from.borderColor, to.borderColor),
      color: from.color && to.color ? getInterpolateColor(progress, from.color, to.color) : '',
    };
  });

  return {
    animatedStyle,
    animateTo,
  };
};
