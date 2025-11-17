import { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import type { HooksTypes } from '../types';

const defaultAnimation = (v: number) => withTiming(v, { duration: 300 });

export default (
  {
    fillOpacity,
    strokeDasharray = 100,
    resetAnimation = defaultAnimation,
    drawAnimation = defaultAnimation,
  }: HooksTypes.UseIconAnimationProps,
) => {
  const strokeOffsetProgress = useSharedValue(strokeDasharray);
  const progress = useSharedValue(0);

  const animatedProps = useAnimatedProps(
    () => ({
      strokeDasharray,
      strokeDashoffset: strokeOffsetProgress.value,
      fillOpacity: fillOpacity ? progress.value : undefined,
    }),
  );

  const reset = () => {
    strokeOffsetProgress.value = resetAnimation(strokeDasharray);
    progress.value = resetAnimation(0);
  };

  const draw = (p: number) => {
    strokeOffsetProgress.value = drawAnimation(strokeDasharray * (p / 100));
    progress.value = resetAnimation(1);
  };

  return {
    strokeOffestStyle: animatedProps,
    reset,
    draw,
  } as HooksTypes.UseIconAnimationReturn;
};
