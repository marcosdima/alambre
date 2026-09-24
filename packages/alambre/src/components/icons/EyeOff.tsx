import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Line from './base/Line';
import Path from './base/Path';
import type { IconProps } from '../../types/icons';

export type EyeOffProps = IconProps & {
  color: ColorValue;
  lineWidth?: number;
};

export default ({
  drawIt = true,
  color,
  lineWidth = 2,
  rotation = 0,
  strokeOffset: _strokeOffset = 0,
  iconAnimation,
  style,
  ...props
}: EyeOffProps) => {
  const lineConfig = {
    stroke: color,
    strokeWidth: lineWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const rotationTransform = {
    transform: [{ rotate: `${rotation}deg` }],
  };

  return (
    <View style={[style, rotationTransform]} {...props}>
      <Svg height="100%" width="100%" viewBox="0 0 24 24">
        <Path
          path={{
            d: 'M10.73 5.08A10.43 10.43 0 0 1 12 5c6.4 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68',
            fill: 'none',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
        <Path
          path={{
            d: 'M6.61 6.61A13.53 13.53 0 0 0 2 12s3.6 7 10 7a9.74 9.74 0 0 0 5.39-1.61',
            fill: 'none',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
        <Path
          path={{
            d: 'M9.88 9.88a3 3 0 1 0 4.24 4.24',
            fill: 'none',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
        <Line
          line={{
            x1: 2,
            y1: 2,
            x2: 22,
            y2: 22,
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
