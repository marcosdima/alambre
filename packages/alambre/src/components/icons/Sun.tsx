import type { CircleProps, LineProps } from 'react-native-svg';
import type { IconstTypes } from '../../types';
import Svg from 'react-native-svg';
import { svgBaseConfig, AnimatedLine } from './utils';
import { View } from '../base';
import { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import Circle from './base/Circle';

const lineConfig: LineProps = {
  fillOpacity: 0,
  stroke: 'black',
  strokeWidth: 3,
  strokeDashoffset: 100,
  strokeDasharray: 100,
  y1: 50,
  x2: 50,
  y2: 50,
};

const circleBaseConfig: CircleProps = {
  cx: 50,
  cy: 50,
  r: 23,
  stroke: 'black',
  fill: 'orange',
  strokeWidth: 3,
};

export default ({ drawIt, iconAnimation, ...props } : IconstTypes.BaseIcon) => {
  const progress = useSharedValue(100);
  const progressShort = useSharedValue(100);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(progress.value, { duration: 1000 }),
  }));

  const animatedShortProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(progressShort.value, { duration: 1000 }),
  }));

  useEffect(() => {
    progress.value = !drawIt ? 100 : 80;
    progressShort.value = !drawIt ? 100 : 85;
  }, [progress, progressShort, drawIt]);

  const circle = {
    circle: {
      ...circleBaseConfig,
      fillOpacity: !drawIt ? 0 : 1,
    },
    drawIt,
    iconAnimation,
  };

  return (
    <View {...props}>
      <Svg {...svgBaseConfig}>
        <Circle {...circle}/>
        {
          [...Array(8)].map(
            (_, i) => {
              const even = i % 2 === 0;
              const auxlineConfig: LineProps = {
                ...lineConfig,
                x1: even ? 0 : 1,
                transform: `rotate(${45 * i} 50 50)`,
              };
              return (
                <AnimatedLine
                  key={i}
                  animatedProps={even ? animatedProps : animatedShortProps}
                  {...auxlineConfig}
                />
              );
            },
          )
        }
      </Svg>
    </View>
  );
};
