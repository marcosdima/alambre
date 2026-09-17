import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import type { IconProps } from '../../types/icons';

export type DocumentsProps = IconProps & {
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
}: DocumentsProps) => {
  const baseConfig = {
    stroke: color,
    strokeWidth: lineWidth,
    fill,
  };
  const strokeOnly = {
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
            d: 'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z',
            ...baseConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M14 2v5a1 1 0 0 0 1 1h5',
            ...strokeOnly,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M16 13H8',
            ...strokeOnly,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M16 17H8',
            ...strokeOnly,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M10 9H8',
            ...strokeOnly,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
      </Svg>
    </View>
  );
};
