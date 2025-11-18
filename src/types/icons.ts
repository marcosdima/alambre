import type { CircleProps, LineProps } from 'react-native-svg';
import type { UseIconAnimationProps } from './hooks';
import type { ViewProps } from './default-react';

export type BaseIcon = ViewProps & {
  drawIt?: boolean;
  rotation?: number;
  strokeOffset?: number;
  iconAnimation?: UseIconAnimationProps;
}

export type CustomCircleProps = BaseIcon & {
  circle: CircleProps;
};

export type CustomLineProps = BaseIcon & {
  line: LineProps;
};
