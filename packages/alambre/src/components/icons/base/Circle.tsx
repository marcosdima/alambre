import type { CircleProps } from 'react-native-svg';
import type { CustomCircleProps } from '../../../types/icons';
import { useEffect, useMemo } from 'react';
import { AnimatedCircle } from '../utils';
import { useIconAnimation } from '../../../hooks';

export default (
  {
    drawIt = true,
    circle,
    iconAnimation,
    rotation = 0,
    strokeOffset = 0,
  }: CustomCircleProps,
) => {
  const strokeDasharray = useMemo(
    () => 2 * Math.PI * (circle.r as number),
    [circle.r],
  );

  const {
    strokeOffestStyle,
    reset,
    draw,
  } = useIconAnimation({
    ...iconAnimation,
    strokeDasharray: iconAnimation?.strokeDasharray ?? strokeDasharray,
  });

  useEffect(() => {
    if (drawIt) draw(strokeOffset);
    else reset();
  }, [draw, drawIt, reset, strokeOffset]);

  const modCircle: CircleProps = {
    ...circle,
    transform: `rotate(${rotation}, ${circle.cx}, ${circle.cy})`,
  };

  return <AnimatedCircle animatedProps={strokeOffestStyle} {...modCircle} />;
};
