import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useSelect } from './use-select';
import type { SelectOption, SelectOptions, SelectState } from './use-select';

export type SegmentedControlProps<T = string> = Omit<
  ViewProps,
  'style' | 'children'
> &
  SelectOptions<T> & {
    style?:
      | StyleProp<ViewStyle>
      | ((state: SelectState<T>) => StyleProp<ViewStyle>);
    children?: ReactNode | ((state: SelectState<T>) => ReactNode);
  };

export default function SegmentedControl<T = string>({
  value,
  options,
  disabled = false,
  onChange,
  style,
  children,
  accessibilityRole = 'radiogroup',
  accessibilityState,
  ...props
}: SegmentedControlProps<T>) {
  const selectState = useSelect({ value, options, disabled, onChange });

  return (
    <View
      {...props}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        disabled,
        ...accessibilityState,
      }}
      style={typeof style === 'function' ? style(selectState) : style}
    >
      {typeof children === 'function' ? children(selectState) : children}
    </View>
  );
}

export type { SelectOption, SelectOptions, SelectState };
