import Animated from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';
import { Circle, Line } from 'react-native-svg';

export type LineCoords = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export const AnimatedLine = Animated.createAnimatedComponent(Line);

export const svgBaseConfig: SvgProps = {
  width: '100%',
  height: '100%',
  viewBox: '0 0 100 100',
};
