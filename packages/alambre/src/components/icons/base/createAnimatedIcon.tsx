import React from 'react';
import { View, type ColorValue } from 'react-native';
import Svg, { PathProps } from 'react-native-svg';
import Path from './Path';
import type { IconProps } from '../../../types/icons';

export type AnimatedIconConfig = {
  viewBox?: string;
  paths: (string | PathProps)[];
};

export type AnimatedIconProps = IconProps & {
  color?: ColorValue;
  size?: number | string;
  strokeWidth?: number;
};

export function createAnimatedIcon({ viewBox = '0 0 24 24', paths }: AnimatedIconConfig) {
  return function AnimatedIconComponent({
    drawIt = false,
    color = 'currentColor',
    size = 24,
    strokeWidth = 2,
    rotation = 0,
    strokeOffset = 0,
    iconAnimation,
    style,
    ...props
  }: AnimatedIconProps) {
    const rotationTransform = {
      transform: [{ rotate: `${rotation}deg` }],
    };

    return (
      <View style={[{ width: size as any, height: size as any }, style, rotationTransform]} {...props}>
        <Svg width="100%" height="100%" viewBox={viewBox}>
          {paths.map((p, index) => {
            const pathProps: PathProps = typeof p === 'string' ? { d: p } : p;
            return (
              <Path
                key={index}
                drawIt={drawIt}
                strokeOffset={strokeOffset}
                iconAnimation={iconAnimation}
                path={{
                  stroke: color,
                  strokeWidth,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  fill: 'none',
                  ...pathProps,
                }}
              />
            );
          })}
        </Svg>
      </View>
    );
  };
}
