import type { CircleProps } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import Circle from './base/Circle';
import { svgBaseConfig } from './utils';
import { View } from 'react-native';
import type { IconProps } from '../../types/icons';

type MoonProps = IconProps & {
  color: ColorValue;
  lineWidth: number;
  fill?: ColorValue;
};

export default (
  {
    drawIt = true,
    iconAnimation,
    color,
    lineWidth,
    fill,
    rotation = 0,
    strokeOffset: _strokeOffset = 0,
    style,
    ...props
  }: MoonProps,
) => {
  const strokeConfig: CircleProps = {
    stroke: color,
    strokeWidth: lineWidth,
  };

  const baseCircle: CircleProps = {
    cx: 50,
    cy: 50,
    r: 35,
    ...strokeConfig,
    fillOpacity: 0,
  };

  const fillProps = fill
    ? { fill, fillOpacity: !drawIt ? 0 : 1 }
    : {};

  const bigCircle = {
    circle: {
      ...baseCircle,
      ...fillProps,
    },
    drawIt,
    iconAnimation,
    strokeOffset: 25,
  };

  const completeCircle = {
    circle: baseCircle,
    drawIt,
    rotation: 279,
    iconAnimation,
    strokeOffset: 80,
  };

  const smallCircles = [
    { cx: 45, cy: 70, r: 5 },
    { cx: 30, cy: 60, r: 3 },
    { cx: 43, cy: 35, r: 5 },
    { cx: 70, cy: 50, r: 5 },
  ];

  const rotationTransform = {
    transform: [{ rotate: `${rotation}deg` }],
  };

  return (
    <View style={[style, rotationTransform]} {...props}>
      <Svg {...svgBaseConfig}>
        <Circle {...bigCircle} />
        <Circle {...completeCircle} />
        {
          smallCircles.map((c, i) => (
            <Circle
              key={i}
              circle={{ ...baseCircle, ...c }}
              drawIt={drawIt}
              strokeOffset={0}
              iconAnimation={iconAnimation}
            />
          ))
        }
      </Svg>
    </View>
  );
};
