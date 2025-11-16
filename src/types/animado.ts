import type { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { TextProps, ViewProps } from './default-react';

export type AnimadoProps = ViewProps & TextProps & {
  animation?: Animation;
};
export type Animation = (value: number) => number;
export type AnimadoStyle = ViewStyle & TextStyle;
export type State = StyleProp<AnimadoStyle>;
export type PosibleColor = ColorValue | undefined;
