import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import Line from './base/Line';
import type { IconProps } from '../../types/icons';

export type TriangleAlertProps = IconProps & {
  color: ColorValue;
  lineWidth?: number;
  fill?: ColorValue;
};

export default ({
  drawIt = true,
  color,
  lineWidth = 2,
  fill = 'none',
  rotation = 0,
  strokeOffset: _strokeOffset = 0,
  iconAnimation,
  style,
  ...props
}: TriangleAlertProps) => {
  const lineConfig = {
    stroke: color,
    strokeWidth: lineWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const pathConfig = {
    ...lineConfig,
    fill,
  };

  const rotationTransform = {
    transform: [{ rotate: `${rotation}deg` }],
  };

  return (
    <View style={[style, rotationTransform]} {...props}>
      <Svg height="100%" width="100%" viewBox="0 0 24 24">
        <Path
          path={{
            d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z',
            ...pathConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
        <Line
          line={{
            x1: 12,
            y1: 9,
            x2: 12,
            y2: 13,
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
        <Line
          line={{
            x1: 12,
            y1: 17,
            x2: 12.01,
            y2: 17,
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
      </Svg>
    </View>
  );
};
