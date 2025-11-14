import Animated from 'react-native-reanimated';
import { useEffect } from 'react';
import useAnimado from './use-animado';
import type { AnimadoProps } from './types';

type AnimadoTextProps = AnimadoProps & {
  text: string,
};

export default (
  {
    style,
    text,
    animation,
    ...props
  }: AnimadoTextProps,
) => {
  const {
    animatedStyle,
    animateTo,
  } = useAnimado(style);

  useEffect(() => {
    animateTo(style, animation);
  }, [animateTo, animation, style]);

  return (
    <Animated.Text style={animatedStyle} {...props}>
      {text}
    </Animated.Text>
  );
};
