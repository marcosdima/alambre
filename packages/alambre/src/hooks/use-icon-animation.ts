import { useCallback } from 'react';
import { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import type { IconAnimationConfig, UseIconAnimationReturn } from '../types/hooks';

const defaultAnimation = (v: number) => withTiming(v, { duration: 300 });

export default (
  {
    fillOpacity,
    strokeDasharray = 100,
    resetAnimation = defaultAnimation,
    drawAnimation = defaultAnimation,
  }: IconAnimationConfig,
) => {
  const strokeOffsetProgress = useSharedValue(strokeDasharray);
  const progress = useSharedValue(0);

  const animatedProps = useAnimatedProps(
    () => ({
      strokeDasharray,
      strokeDashoffset: strokeOffsetProgress.value,
      fillOpacity: fillOpacity !== undefined ? fillOpacity * progress.value : undefined,
    }),
    [fillOpacity, strokeDasharray],
  );

  const reset = useCallback(() => {
    strokeOffsetProgress.value = resetAnimation(strokeDasharray);
    progress.value = resetAnimation(0);
  }, [resetAnimation, strokeDasharray, strokeOffsetProgress, progress]);

  const draw = useCallback((p: number) => {
    strokeOffsetProgress.value = drawAnimation(strokeDasharray * (p / 100));
    progress.value = drawAnimation(1);
  }, [drawAnimation, strokeDasharray, strokeOffsetProgress, progress]);

  return {
    strokeOffestStyle: animatedProps,
    strokeOffsetStyle: animatedProps,
    reset,
    draw,
  } as UseIconAnimationReturn;
};

