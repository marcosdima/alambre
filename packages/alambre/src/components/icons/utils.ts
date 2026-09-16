import Animated from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';
import { Circle, Line, Path } from 'react-native-svg';

export const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export const AnimatedLine = Animated.createAnimatedComponent(Line);
export const AnimatedPath = Animated.createAnimatedComponent(Path);

export const svgBaseConfig: SvgProps = {
  width: '100%',
  height: '100%',
  viewBox: '0 0 100 100',
};
