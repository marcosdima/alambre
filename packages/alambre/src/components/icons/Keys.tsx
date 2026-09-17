import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import type { IconProps } from '../../types/icons';

export type KeysProps = IconProps & {
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
}: KeysProps) => {
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
            d: 'M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z',
            ...baseConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
      </Svg>
    </View>
  );
};
