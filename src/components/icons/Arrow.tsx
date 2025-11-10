import type { ColorValue } from 'react-native';
import type { LineProps } from 'react-native-svg';
import Svg from 'react-native-svg';
import Line from './base/Line';
import type { DefaultReact } from '@types';
import { View } from '@base';

const body: LineProps = {
  x1: 20, y1: 50,
  // --------- //
  x2: 180, y2: 50,
};

const arrowUp: LineProps = {
  x1: 130, y1: 0,
  // --------- //
  x2: 180, y2: 50,
};

const arrowDown: LineProps = {
  x1: 130, y1: 100,
  // --------- //
  x2: 180, y2: 50,
};

type ArrowProps = DefaultReact.ViewProps & {
  reset?: boolean;
  color: ColorValue;
  lineWidth: number;
  rotate?: number;
};

export default (
  {
    reset = false,
    color,
    lineWidth,
    rotate = 0,
    style,
    ...props
  }: ArrowProps,
) => {
  const baseConfig: LineProps = {
    stroke: color,
    strokeWidth: lineWidth,
  };
  const rotation = {
    transform: [{ rotate: `${rotate}deg` }],
  };
  return (
    <View style={[style, rotation]}  {...props}>
      <Svg height='100%' width='100%' viewBox='0 0 200 100'>
        <Line
          line={{
            ...body,
            ...baseConfig,
          }}
          reset={reset}
        />
        <Line
          line={{
            ...arrowUp,
            ...baseConfig,
          }}
          reset={reset}
        />
        <Line
          line={{
            ...arrowDown,
            ...baseConfig,
          }}
          reset={reset}
        />
      </Svg>
    </View>
  );
};
