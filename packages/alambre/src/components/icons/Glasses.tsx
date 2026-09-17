import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Circle from './base/Circle';
import Path from './base/Path';
import type { IconProps } from '../../types/icons';

export type GlassesProps = IconProps & {
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
}: GlassesProps) => {
  const strokeOnly = {
    stroke: color,
    strokeWidth: lineWidth,
    fill: 'none',
  };
  const lensConfig = {
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
        <Circle
          circle={{
            cx: 6,
            cy: 15,
            r: 4,
            ...lensConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Circle
          circle={{
            cx: 18,
            cy: 15,
            r: 4,
            ...lensConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2',
            ...strokeOnly,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M2.5 13 5 7c.7-1.3 1.4-2 3-2',
            ...strokeOnly,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M21.5 13 19 7c-.7-1.3-1.5-2-3-2',
            ...strokeOnly,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
      </Svg>
    </View>
  );
};
