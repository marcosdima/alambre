import type { LineProps } from 'react-native-svg';
import { useEffect } from 'react';
import { AnimatedLine } from '../utils';
import type { CustomLineProps } from '../../../types/icons';
import { useIconAnimation } from '../../../hooks';

export default (
  {
    drawIt = true,
    line,
    iconAnimation,
    rotation = 0,
    strokeOffset = 0,
  }: CustomLineProps,
) => {
  const x1 = Number(line.x1) || 0;
  const y1 = Number(line.y1) || 0;
  const x2 = Number(line.x2) || 0;
  const y2 = Number(line.y2) || 0;
  const length = Math.hypot(x2 - x1, y2 - y1);

  const {
    strokeOffsetStyle,
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

  const targetDasharray = iconAnimation?.strokeDasharray ?? length;
  const modLine: LineProps = {
    ...line,
    strokeDasharray: targetDasharray,
    strokeDashoffset: targetDasharray,
    transform: `rotate(${rotation}, ${line.x2}, ${line.y2})`,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <AnimatedLine animatedProps={strokeOffsetStyle ?? strokeOffestStyle} {...modLine}/>
  );
};
