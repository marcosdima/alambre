import type { IconProps } from '../../types/icons';
import type { LineProps } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import Line from './base/Line';
import { View } from 'react-native';
import { svgBaseConfig } from './utils';

type CrossProps = IconProps & {
  drawIt?: boolean;
  color: ColorValue;
  lineWidth: number;
};

export default (
  {
    drawIt = true,
    color,
    lineWidth,
    rotation = 0,
    iconAnimation,
    style,
    ...props
  }: CrossProps,
) => {
  const baseLineConfig: LineProps = {
    stroke: color,
    strokeWidth: lineWidth,
  };

  const topLeft = {
    line: {
      ...baseLineConfig,
      x1: 10, y1: 10,
      x2: 90, y2: 90,
    },
    drawIt,
    iconAnimation,
  };

  const bottomLeft = {
    line: {
      ...baseLineConfig,
      x1: 90, y1: 10,
      x2: 10, y2: 90,
    },
    drawIt,
    iconAnimation,
  };

  const rotationTransform = {
    transform: [{ rotate: `${rotation}deg` }],
  };

  return (
    <View style={[style, rotationTransform]} {...props}>
      <Svg {...svgBaseConfig}>
        <Line {...topLeft}/>
        <Line {...bottomLeft}/>
      </Svg>
    </View>
  );
};
