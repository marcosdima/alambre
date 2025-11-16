import Animated from 'react-native-reanimated';
import { useEffect } from 'react';
import type { AnimadoProps } from '../../../types/animado';
import useAnimado from './use-animado';

export default ({ style, animation, ...props }: AnimadoProps) => {
  const {
    animatedStyle,
    animateTo,
  } = useAnimado(style);

  useEffect(() => {
    animateTo(style, animation);
  }, [animateTo, animation, style]);

  return (
    <Animated.View style={animatedStyle} {...props}>
      <></>
    </Animated.View>
  );
};
