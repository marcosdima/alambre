import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import type { IconProps } from '../../types/icons';

export type BackpackProps = IconProps & {
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
}: BackpackProps) => {
  const bodyConfig = {
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
            d: 'M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
            ...bodyConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M8 10h8',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M8 18h8',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
      </Svg>
    </View>
  );
};
