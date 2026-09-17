import type { PathProps } from 'react-native-svg';
import { useEffect } from 'react';
import type { CustomPathProps } from '../../../types/icons';
import { AnimatedPath } from '../utils';
import { useIconAnimation } from '../../../hooks';

export default (
  {
    drawIt = true,
    path,
    iconAnimation,
    rotation = 0,
    strokeOffset = 0,
  }: CustomPathProps,
) => {
  const strokeDasharray = 1;

  const {
    strokeOffsetStyle,
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

  const targetDasharray = iconAnimation?.strokeDasharray ?? strokeDasharray;
  const modPath: PathProps & { pathLength: number } = {
    fill: 'none',
    ...path,
    pathLength: 1,
    strokeDasharray: targetDasharray,
    strokeDashoffset: targetDasharray,
    transform: `rotate(${rotation}, 0, 0)`,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <AnimatedPath animatedProps={strokeOffsetStyle ?? strokeOffestStyle} {...modPath}/>
  );
};
