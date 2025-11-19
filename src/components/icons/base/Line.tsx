import type { LineProps } from 'react-native-svg';
import { useEffect } from 'react';
import { AnimatedLine } from '../utils';
import type { CustomLineProps } from '../../../types/icons';
import { useIconAnimation } from '../../../hooks';

export default (
  {
    drawIt,
    line,
    iconAnimation,
    rotation = 0,
    strokeOffset = 0,
  }: CustomLineProps,
) => {
  const length = Math.hypot(
    (line.x2 as number) -(line.x1 as number),
    (line.y2 as number) - (line.y1 as number),
  );

  const {
    strokeOffestStyle,
    reset,
    draw,
  } = useIconAnimation({
    ...iconAnimation,
    strokeDasharray: iconAnimation?.strokeDasharray ?? length,
  });

  useEffect(() => {
    if (drawIt) draw(strokeOffset);
    else reset();
  }, [draw, drawIt, reset, strokeOffset]);

  const modLine: LineProps = {
    ...line,
    transform: `rotate(${rotation}, ${line.x2}, ${line.y2})`,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <AnimatedLine animatedProps={strokeOffestStyle} {...modLine}/>
  );
};
