import type { ColorValue, StyleProp } from 'react-native';
import type { TextProps, ViewProps } from './default-react';

export type AnimadoProps = ViewProps & TextProps & {
  animation?: Animation;
};

export type AnimadoStyle = {
  backgroundColor?: ColorValue
  borderColor?: ColorValue
  color?: ColorValue
};

export type Animation = (value: number) => number;
export type State = StyleProp<AnimadoStyle>;
export type PosibleColor = ColorValue | undefined;

export type AnimadoTextProps = AnimadoProps & {
  text: string,
};
