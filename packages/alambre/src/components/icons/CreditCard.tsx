import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import Line from './base/Line';
import type { IconProps } from '../../types/icons';

export type CreditCardProps = IconProps & {
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
}: CreditCardProps) => {
  const cardConfig = {
    stroke: color,
    strokeWidth: lineWidth,
    fill,
  };
  const lineConfig = {
    stroke: color,
    strokeWidth: lineWidth,
    fill: 'none',
  };
  const rotationTransform = {
    transform: [{ rotate: `${rotation}deg` }],
  };

  return (
    <View style={[style, rotationTransform]} {...props}>
      <Svg height="100%" width="100%" viewBox="0 0 24 24">
        <Path
          path={{
            d: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
            ...cardConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Line
          line={{
            x1: 2,
            y1: 10,
            x2: 22,
            y2: 10,
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Line
          line={{
            x1: 6,
            y1: 14,
            x2: 8,
            y2: 14,
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
      </Svg>
    </View>
  );
};
