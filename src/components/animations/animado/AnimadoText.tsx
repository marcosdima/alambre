import Animated from 'react-native-reanimated';
import { useEffect } from 'react';
import useAnimado from './use-animado';
import type { AnimadoTextProps } from '../../../types/animado';

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
    <Animated.Text style={[style, animatedStyle]} {...props}>
      {text}
    </Animated.Text>
  );
};
