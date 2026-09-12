import type { ColorValue } from 'react-native';
import type { LineProps } from 'react-native-svg';
import Svg from 'react-native-svg';
import Line from './base/Line';
import type { IconstTypes } from '../../types';
import { View } from '../base';

const body: LineProps = {
  x1: 20, y1: 50,
  x2: 180, y2: 50,
};

const arrowUp: LineProps = {
  x1: 130, y1: 0,
  x2: 180, y2: 50,
};

const arrowDown: LineProps = {
  x1: 130, y1: 100,
  x2: 180, y2: 50,
};

type ArrowProps = IconstTypes.BaseIcon & {
  drawIt?: boolean;
  color: ColorValue;
  lineWidth: number;
};

export default (
  {
    drawIt = false,
    color,
    lineWidth,
    rotation = 0,
    style,
    ...props
  }: ArrowProps,
) => {
  const baseConfig: LineProps = {
    stroke: color,
    strokeWidth: lineWidth,
  };
  const rotationTransform = {
    transform: [{ rotate: `${rotation}deg` }],
  };
  return (
    <View style={[style, rotationTransform]} {...props}>
      <Svg height='100%' width='100%' viewBox='0 0 200 100'>
        <Line
          line={{
            ...body,
            ...baseConfig,
          }}
          drawIt={drawIt}
        />
        <Line
          line={{
            ...arrowUp,
            ...baseConfig,
          }}
          drawIt={drawIt}
        />
        <Line
          line={{
            ...arrowDown,
            ...baseConfig,
          }}
          drawIt={drawIt}
        />
      </Svg>
    </View>
  );
};
