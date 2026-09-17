import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import type { IconProps } from '../../types/icons';

export type GiftProps = IconProps & {
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
}: GiftProps) => {
  const boxConfig = {
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
            d: 'M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8',
            ...boxConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M4 7h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z',
            ...boxConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M12 7v14',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
      </Svg>
    </View>
  );
};
