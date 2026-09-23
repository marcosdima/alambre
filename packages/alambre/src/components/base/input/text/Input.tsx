import type { ComponentProps } from 'react';
import { useState } from 'react';
import type {
  StyleProp,
  TextStyle,
} from 'react-native';
import { TextInput as RNTextInput } from 'react-native';

export type InputState = {
  focused: boolean;
  disabled: boolean;
  hasValue: boolean;
  error: boolean;
};

export type InputProps = Omit<ComponentProps<typeof RNTextInput>, 'style'> & {
  disabled?: boolean;
  error?: boolean | string;
  style?: StyleProp<TextStyle> | ((state: InputState) => StyleProp<TextStyle>);
};

export default function Input({
  disabled = false,
  error = false,
  value,
  defaultValue,
  style,
  onFocus,
  onBlur,
  editable,
  accessibilityState,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const isEditable = editable !== undefined ? editable && !disabled : !disabled;
  const hasValue = Boolean(value || defaultValue);
  const isError = Boolean(error);

  const inputState: InputState = {
    focused,
    disabled,
    hasValue,
    error: isError,
  };

  const handleFocus: ComponentProps<typeof RNTextInput>['onFocus'] = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: ComponentProps<typeof RNTextInput>['onBlur'] = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <RNTextInput
      {...props}
      value={value}
      defaultValue={defaultValue}
      editable={isEditable}
      onFocus={handleFocus}
      onBlur={handleBlur}
      accessibilityState={{
        ...accessibilityState,
        disabled,
      }}
      aria-invalid={isError}
      style={typeof style === 'function' ? style(inputState) : style}
    />
  );
}
