import type { CircleProps } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import Circle from './base/Circle';
import Line from './base/Line';
import { svgBaseConfig } from './utils';
import { View } from 'react-native';
import type { IconProps } from '../../types/icons';

const RAYS = 8;

const DEFAULT_FILL = '#fbbf24';

type SunProps = IconProps & {
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
  }: SunProps,
) => {
  const strokeConfig: CircleProps = {
    stroke: color,
    strokeWidth: lineWidth,
  };

  const fillProps = {
    fill: fill ?? DEFAULT_FILL,
    fillOpacity: drawIt ? 1 : 0,
  };

  const circle = {
    circle: {
      cx: 50,
      cy: 50,
      r: 23,
      ...strokeConfig,
      ...fillProps,
    },
    drawIt,
    strokeOffset: 20,
    iconAnimation: { ...iconAnimation, fillOpacity: 1 },
  };

  const rays = [...Array(RAYS)].map((_, i) => ({
    line: {
      x1: 0,
      y1: 50,
      x2: 50,
      y2: 50,
      ...strokeConfig,
      fillOpacity: 0,
    },
    drawIt,
    rotation: (360 / RAYS) * i,
    strokeOffset: i % 2 === 0 ? 80 : 85,
    iconAnimation,
  }));

  const rotationTransform = {
    transform: [{ rotate: `${rotation}deg` }],
  };

  return (
    <View style={[style, rotationTransform]} {...props}>
      <Svg {...svgBaseConfig}>
        <Circle {...circle}/>
        {rays.map((ray, i) => <Line key={i} {...ray}/>)}
      </Svg>
    </View>
  );
};
