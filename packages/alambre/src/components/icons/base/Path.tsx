import type { PathProps } from 'react-native-svg';
import { useEffect } from 'react';
import type { CustomPathProps } from '../../../types/icons';
import { AnimatedPath } from '../utils';
import { useIconAnimation } from '../../../hooks';

export default (
  {
    drawIt,
    path,
    iconAnimation,
    rotation = 0,
    strokeOffset = 0,
  }: CustomPathProps,
) => {
  const strokeDasharray = 1;

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

  const modPath: PathProps & { pathLength: number } = {
    ...path,
    pathLength: 1,
    transform: `rotate(${rotation}, 0, 0)`,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <AnimatedPath animatedProps={strokeOffestStyle} {...modPath}/>
  );
};
