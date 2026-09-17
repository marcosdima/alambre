import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import type { IconProps } from '../../types/icons';

export type WalletProps = IconProps & {
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
}: WalletProps) => {
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
            d: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1',
            ...baseConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        <Path
          path={{
            d: 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
            ...baseConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
      </Svg>
    </View>
  );
};
