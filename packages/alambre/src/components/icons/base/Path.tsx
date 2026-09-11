import type { PathProps } from 'react-native-svg';
import { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import { AnimatedPath } from '../utils';

type CustomPathProps = {
  reset: boolean;
  path: PathProps;
  rotation?: number;
  strokeOffset?: number;
};

const timingConfig = { duration: 1000 };

export default (
  {
    reset,
    path,
    rotation = 0,
    strokeOffset = 0,
  }: CustomPathProps,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const lengthRef = useRef(0);

  useEffect(() => {
    if (ref.current?.getTotalLength) {
      lengthRef.current = ref.current.getTotalLength();
    }
  }, [path.d]);

  const progress = useSharedValue(lengthRef.current);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: progress.value,
    fillOpacity: withTiming(
      path.fillOpacity && !reset && (path.fillOpacity as number) > 0 ? 1 : 0,
      timingConfig,
    ),
  }));

  useEffect(() => {
    progress.value = withTiming(
      reset ? lengthRef.current : lengthRef.current * (strokeOffset / 100),
      timingConfig,
    );
  }, [progress, reset, strokeOffset]);

  const modPath: PathProps = {
    ...path,
    strokeDasharray: lengthRef.current,
    transform: `rotate(${rotation}, 0, 0)`,
  };

  return (
    <AnimatedPath
      ref={ref}
      animatedProps={animatedProps}
      {...modPath}
    />
  );
};
