import type { PathProps } from 'react-native-svg';
import { useEffect, useMemo } from 'react';
import { svgPathProperties } from 'svg-path-properties';
import type { CustomPathProps } from '../../../types/icons';
import { AnimatedPath } from '../utils';
import { useIconAnimation } from '../../../hooks';

const getPathLength = (d?: string): number => {
  if (!d) return 1;
  try {
    return Math.max(1, new svgPathProperties(d).getTotalLength());
  } catch {
    return 1;
  }
};

export default (
  {
    drawIt = true,
    path,
    iconAnimation,
    rotation = 0,
    strokeOffset = 0,
  }: CustomPathProps,
) => {
  const pathLength = useMemo(() => getPathLength(path?.d), [path?.d]);

  const {
    strokeOffsetStyle,
    strokeOffestStyle,
    reset,
    draw,
  } = useIconAnimation({
    ...iconAnimation,
    strokeDasharray: iconAnimation?.strokeDasharray ?? pathLength,
  });

  useEffect(() => {
    if (drawIt) draw(strokeOffset);
    else reset();
  }, [draw, drawIt, reset, strokeOffset]);

  const targetDasharray = iconAnimation?.strokeDasharray ?? pathLength;
  const modPath: PathProps & { pathLength?: number } = {
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
