import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import Line from './base/Line';
import type { IconProps } from '../../types/icons';

export type PhoneProps = IconProps & {
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
}: PhoneProps) => {
  const baseConfig = {
    stroke: color,
    strokeWidth: lineWidth,
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
            d: 'M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z',
            ...baseConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Line
          line={{
            x1: 11.7,
            y1: 18,
            x2: 12.3,
            y2: 18,
            stroke: color,
            strokeWidth: lineWidth,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
      </Svg>
    </View>
  );
};
