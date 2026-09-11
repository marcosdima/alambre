import type { ComponentProps } from 'react';
import type { Pressable, Text, View } from 'react-native';
import type { SafeAreaView } from 'react-native-safe-area-context';

export type TextProps = ComponentProps<typeof Text>;
export type ViewProps = ComponentProps<typeof View>;
export type SafeAreaViewProps = ComponentProps<typeof SafeAreaView>;
export type PressableProps = ComponentProps<typeof Pressable>;
