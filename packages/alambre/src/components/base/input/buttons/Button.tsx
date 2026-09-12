import type { ComponentProps, ReactNode } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';

export type ButtonState = {
  pressed: boolean;
  disabled: boolean;
  loading: boolean;
};

export type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'style' | 'children'> & {
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle> | ((state: ButtonState) => StyleProp<ViewStyle>);
  children?: ReactNode | ((state: ButtonState) => ReactNode);
};

export default function Button({
  loading = false,
  disabled = false,
  role = 'button',
  onPress,
  children,
  style,
  accessibilityState,
  ...props
}: ButtonProps) {
  const blocked = disabled || loading;

  const handlePress = (event: GestureResponderEvent) => {
    if (blocked) {
      return;
    }
    onPress?.(event);
  };

  return (
    <Pressable
      {...props}
      role={role}
      disabled={blocked}
      accessibilityState={{ ...accessibilityState, busy: loading }}
      onPress={handlePress}
      style={
        typeof style === 'function'
          ? ({ pressed }) => style({ pressed, disabled, loading })
          : style
      }
    >
      {({ pressed }) =>
        typeof children === 'function'
          ? children({ pressed, disabled, loading })
          : children
      }
    </Pressable>
  );
}
