import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import type { IconProps } from '../../types/icons';

export type UmbrellaProps = IconProps & {
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
}: UmbrellaProps) => {
  const canopyConfig = {
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
            d: 'M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z',
            ...canopyConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M12 2v2',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M12 13v7a2 2 0 0 0 4 0',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
      </Svg>
    </View>
  );
};
