import type { CircleProps, LineProps, PathProps } from 'react-native-svg';
import type { IconAnimationConfig } from './hooks';
import type { ViewProps } from './default-react';

export type IconProps = ViewProps & {
  drawIt?: boolean;
  rotation?: number;
  strokeOffset?: number;
  iconAnimation?: IconAnimationConfig;
}

export type CustomCircleProps = IconProps & {
  circle: CircleProps;
};

export type CustomLineProps = IconProps & {
  line: LineProps;
};

export type CustomPathProps = IconProps & {
  path: PathProps;
};
