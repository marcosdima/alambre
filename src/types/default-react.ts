import type { ComponentProps, ReactNode, ReactElement } from 'react';
import type { Text, TextInput, View } from 'react-native';
import type { SafeAreaView } from 'react-native-safe-area-context';

export type TextProps = ComponentProps<typeof Text>;
export type TextInputProps = ComponentProps<typeof TextInput>;
export type ViewProps = ComponentProps<typeof View>;
export type SafeAreaViewProps = ComponentProps<typeof SafeAreaView>;

export type ChildInfo = {
  key: string;
  props: object;
  children: ReactNode[];
  raw: ReactElement,
};
