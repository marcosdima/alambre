import type { LineProps } from 'react-native-svg';
import { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import { AnimatedLine } from '../utils';

type CustomLineProps = {
  reset: boolean;
  line: LineProps;
  rotation?: number;
  strokeOffset?: number;
};

const timingConfig = { duration: 1000 };

export default (
  {
    reset,
    line,
    rotation = 0,
    strokeOffset = 0,
  }: CustomLineProps,
) => {
  const length = Math.hypot(
    (line.x2 as number) -(line.x1 as number),
    (line.x2 as number) - (line.y1 as number),
  );
  const strokeDasharray = useRef(length).current;

  const progressCircle = useSharedValue(strokeDasharray);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: progressCircle.value,
    fillOpacity: withTiming(
      line.fillOpacity && !reset && line.fillOpacity as number > 0
        ? 1
        : 0,
      timingConfig,
    ),
  }));

  useEffect(() => {
    progressCircle.value = withTiming(
      reset ? strokeDasharray : strokeDasharray * (strokeOffset / 100),
      timingConfig,
    );
  }, [progressCircle, reset, strokeDasharray, strokeOffset]);

  const modLine: LineProps = {
    ...line,
    strokeDasharray,
    transform: `rotate(${rotation}, ${line.x2}, ${line.y2})`,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <AnimatedLine
      animatedProps={animatedCircleProps}
      {...modLine}
    />
  );
};
