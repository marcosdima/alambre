import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Circle from './base/Circle';
import Line from './base/Line';
import type { IconProps } from '../../types/icons';

export type CircleXProps = IconProps & {
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
  strokeOffset = 0,
  iconAnimation,
  style,
  ...props
}: CircleXProps) => {
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
        <Circle
          circle={{
            cx: 12,
            cy: 12,
            r: 10,
            fill,
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={strokeOffset}
        />
        <Line
          line={{
            x1: 15,
            y1: 9,
            x2: 9,
            y2: 15,
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={strokeOffset}
        />
        <Line
          line={{
            x1: 9,
            y1: 9,
            x2: 15,
            y2: 15,
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={strokeOffset}
        />
      </Svg>
    </View>
  );
};
