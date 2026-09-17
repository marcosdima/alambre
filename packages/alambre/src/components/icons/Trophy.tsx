import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import type { IconProps } from '../../types/icons';

export type TrophyProps = IconProps & {
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
}: TrophyProps) => {
  const strokeOnly = {
    stroke: color,
    strokeWidth: lineWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  const bodyConfig = {
    stroke: color,
    strokeWidth: lineWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill,
  };
  const rotationTransform = {
    transform: [{ rotate: `${rotation}deg` }],
  };

  return (
    <View style={[style, rotationTransform]} {...props}>
      <Svg height="100%" width="100%" viewBox="0 0 24 24">
        {/* Cup body */}
        <Path
          path={{
            d: 'M6 3h12v7a6 6 0 0 1-12 0V3z',
            ...bodyConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        {/* Left handle */}
        <Path
          path={{
            d: 'M6 5H4a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h2',
            ...strokeOnly,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        {/* Right handle */}
        <Path
          path={{
            d: 'M18 5h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2',
            ...strokeOnly,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
        {/* Stem & base */}
        <Path
          path={{
            d: 'M12 16v4M8 20h8',
            ...strokeOnly,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
        />
      </Svg>
    </View>
  );
};
