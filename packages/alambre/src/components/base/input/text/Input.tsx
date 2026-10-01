import type { ComponentProps, ReactNode } from 'react';
import { createContext, forwardRef, useContext, useState } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import { TextInput as RNTextInput, View, Text, Pressable } from 'react-native';

export type InputState = {
  focused: boolean;
  disabled: boolean;
  hasValue: boolean;
  error: boolean;
};

type InputContextValue = InputState & {
  setFocused: (focused: boolean) => void;
  setHasValue: (hasValue: boolean) => void;
};

const InputContext = createContext<InputContextValue | null>(null);

function useInputContext() {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error('Input compound components cannot be rendered outside the Input.Root component');
  }
  return context;
}

export type InputRootProps = Omit<ViewProps, 'style'> & {
  disabled?: boolean;
  error?: boolean | string;
  hasValue?: boolean;
  style?: StyleProp<ViewStyle> | ((state: InputState) => StyleProp<ViewStyle>);
  children: ReactNode | ((state: InputState) => ReactNode);
};

const Root = ({ disabled = false, error = false, hasValue: initialHasValue = false, style, children, ...props }: InputRootProps) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(initialHasValue);

  const isError = Boolean(error);
  const state: InputState = { focused, disabled, hasValue, error: isError };

  return (
    <InputContext.Provider value={{ ...state, setFocused, setHasValue }}>
      <View {...props} style={typeof style === 'function' ? style(state) : style}>
        {typeof children === 'function' ? children(state) : children}
      </View>
    </InputContext.Provider>
  );
};

export type InputFieldProps = Omit<ComponentProps<typeof RNTextInput>, 'style'> & {
  style?: StyleProp<TextStyle> | ((state: InputState) => StyleProp<TextStyle>);
};

const Field = forwardRef<RNTextInput, InputFieldProps>(({ style, onFocus, onBlur, onChangeText, editable, accessibilityState, value, defaultValue, ...props }, ref) => {
  const context = useInputContext();
  const { disabled, error, setFocused, setHasValue } = context;

  const isEditable = editable !== undefined ? editable && !disabled : !disabled;

  const handleFocus: ComponentProps<typeof RNTextInput>['onFocus'] = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: ComponentProps<typeof RNTextInput>['onBlur'] = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    setHasValue(text.length > 0);
    onChangeText?.(text);
  };

  return (
    <RNTextInput
      ref={ref}
      {...props}
      value={value}
      defaultValue={defaultValue}
      editable={isEditable}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChangeText={handleChangeText}
      accessibilityState={{ ...accessibilityState, disabled }}
      aria-invalid={error}
      style={typeof style === 'function' ? style(context) : style}
    />
  );
});

Field.displayName = 'Input.Field';

type InputLabelProps = Omit<ComponentProps<typeof Text>, 'style'> & {
  style?: StyleProp<TextStyle> | ((state: InputState) => StyleProp<TextStyle>);
};

const Label = ({ style, ...props }: InputLabelProps) => {
  const context = useInputContext();
  return <Text {...props} style={typeof style === 'function' ? style(context) : style} />;
};

type InputAffixProps = Omit<ViewProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: InputState) => StyleProp<ViewStyle>);
};

const Affix = ({ style, ...props }: InputAffixProps) => {
  const context = useInputContext();
  return <View {...props} style={typeof style === 'function' ? style(context) : style} />;
};

type InputClearButtonProps = Omit<ComponentProps<typeof Pressable>, 'style'> & {
  onClear: () => void;
  style?: StyleProp<ViewStyle> | ((state: InputState) => StyleProp<ViewStyle>);
};

const ClearButton = ({ style, onClear, children, ...props }: InputClearButtonProps) => {
  const context = useInputContext();
  if (!context.hasValue) return null;
  return (
    <Pressable
      {...props}
      onPress={onClear}
      style={typeof style === 'function' ? style(context) : style}
    >
      {children}
    </Pressable>
  );
};

type InputPasswordToggleProps = Omit<ComponentProps<typeof Pressable>, 'style'> & {
  isSecure?: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle> | ((state: InputState) => StyleProp<ViewStyle>);
};

const PasswordToggle = ({ style, onToggle, children, ...props }: InputPasswordToggleProps) => {
  const context = useInputContext();
  return (
    <Pressable
      {...props}
      onPress={onToggle}
      style={typeof style === 'function' ? style(context) : style}
    >
      {children}
    </Pressable>
  );
};

type InputFeedbackProps = Omit<ComponentProps<typeof Text>, 'style'> & {
  style?: StyleProp<TextStyle> | ((state: InputState) => StyleProp<TextStyle>);
};

const Feedback = ({ style, ...props }: InputFeedbackProps) => {
  const context = useInputContext();
  return <Text role="alert" aria-invalid={context.error} {...props} style={typeof style === 'function' ? style(context) : style} />;
};

export const Input = Object.assign(Root, { Root, Field, Label, Affix, ClearButton, PasswordToggle, Feedback });
export default Input;
