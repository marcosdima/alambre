import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import { View } from 'react-native';
import Path from './base/Path';
import Line from './base/Line';
import type { IconProps } from '../../types/icons';

export type TrashProps = IconProps & {
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
}: TrashProps) => {
  const lineConfig = {
    stroke: color,
    strokeWidth: lineWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const pathConfig = {
    ...lineConfig,
    fill,
  };

  const rotationTransform = {
    transform: [{ rotate: `${rotation}deg` }],
  };

  return (
    <View style={[style, rotationTransform]} {...props}>
      <Svg height="100%" width="100%" viewBox="0 0 24 24">
        {/* Horizontal top bar */}
        <Path
          path={{
            d: 'M3 6h18',
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
        {/* Bin body */}
        <Path
          path={{
            d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
            ...pathConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
        {/* Lid / handle */}
        <Path
          path={{
            d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
            ...pathConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
        {/* Rib 1 */}
        <Line
          line={{
            x1: 10,
            y1: 11,
            x2: 10,
            y2: 17,
            ...lineConfig,
          }}
          drawIt={drawIt}
          iconAnimation={iconAnimation}
          strokeOffset={_strokeOffset}
        />
        {/* Rib 2 */}
        <Line
          line={{
            x1: 14,
            y1: 11,
            x2: 14,
            y2: 17,
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
