import { ComponentProps } from "react";
import { Text, TextInput, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type TextProps = ComponentProps<typeof Text>;
type TextInputProps = ComponentProps<typeof TextInput>;
type ViewProps = ComponentProps<typeof View>;
type SafeAreaViewProps = ComponentProps<typeof SafeAreaView>;

export {
    TextProps,
    TextInputProps,
    ViewProps,
    SafeAreaViewProps,
}