import type { GestureResponderEvent, TextStyle } from 'react-native';
import { Pressable } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import AnimadoText from '../../../animations/animado/AnimadoText';
import type { PressableProps } from '../../../../types/default-react';

type BorderButtonProps = PressableProps & {
  label: string,
  textStyle: TextStyle,
};

export default (
  {
    label,
    textStyle,
    onPressIn,
    onPressOut,
    ...props
  }: BorderButtonProps,
) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: GestureResponderEvent) => {
    scale.value = withSpring(0.75);
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    scale.value = withSpring(1);
    onPressOut?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <AnimadoText text={label} style={[textStyle, animatedStyle]} />
    </Pressable>
  );
};

