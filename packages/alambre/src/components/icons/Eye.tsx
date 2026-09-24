import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Circle from './base/Circle';
import Path from './base/Path';
import type { IconProps } from '../../types/icons';

export type EyeProps = IconProps & {
  color: ColorValue;
  lineWidth?: number;
};

export default ({
  drawIt = true,
  color,
  lineWidth = 2,
  rotation = 0,
  strokeOffset: _strokeOffset = 0,
  iconAnimation,
  style,
  ...props
}: EyeProps) => {
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
        <Path
          path={{
            d: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z',
            fill: 'none',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
        <Circle
          circle={{
            cx: 12,
            cy: 12,
            r: 3,
            fill: 'none',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
      </Svg>
    </View>
  );
};
