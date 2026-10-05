import type { ComponentProps, ReactNode } from 'react';
import { createContext, forwardRef, useContext, useState, useEffect, useCallback } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import { TextInput as RNTextInput, View, Text, Pressable } from 'react-native';

export type InputState = {
  focused: boolean;
  disabled: boolean;
  hasValue: boolean;
  error: boolean;
  warning: boolean;
  errorMessage?: string;
  warningMessage?: string;
};

export type InputContextValue = InputState & {
  setFocused: (focused: boolean) => void;
  setHasValue: (hasValue: boolean) => void;
  validate: (text: string) => void;
};

const InputContext = createContext<InputContextValue | null>(null);

function useInputContext() {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error('Input compound components cannot be rendered outside the Input.Root component');
  }
  return context;
}

export type InputRootProps = Omit<ViewProps, 'style' | 'children'> & {
  disabled?: boolean;
  error?: boolean | string;
  warning?: boolean | string;
  hasValue?: boolean;
  required?: boolean | string;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  maxLengthMessage?: string;
  style?: StyleProp<ViewStyle> | ((state: InputState) => StyleProp<ViewStyle>);
  children: ReactNode | ((state: InputState) => ReactNode);
};

const Root = ({
  disabled = false,
  error: externalError = false,
  warning: externalWarning = false,
  hasValue: initialHasValue = false,
  required,
  maxLength,
  pattern,
  patternMessage,
  maxLengthMessage,
  style,
  children,
  ...props
}: InputRootProps) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(initialHasValue);
  const [internalError, setInternalError] = useState<string | false>(false);
  const [internalWarning] = useState<string | false>(false);

  const validate = useCallback((text: string) => {
    let err: string | false = false;

    if (required && !text) {
      err = typeof required === 'string' ? required : 'This field is required';
    } else if (maxLength && text.length > maxLength) {
      err = maxLengthMessage || `Maximum length is ${maxLength}`;
    } else if (pattern && !pattern.test(text)) {
      err = patternMessage || 'Invalid format';
    }

    setInternalError(err);
  }, [required, maxLength, pattern, patternMessage, maxLengthMessage]);

  const isError = Boolean(externalError || internalError);
  const isWarning = Boolean(!isError && (externalWarning || internalWarning));
  const errorMessage = typeof externalError === 'string' ? externalError : (internalError || undefined);
  const warningMessage = typeof externalWarning === 'string' ? externalWarning : (internalWarning || undefined);

  const state: InputState = {
    focused,
    disabled,
    hasValue,
    error: isError,
    warning: isWarning,
    errorMessage,
    warningMessage,
  };

  return (
    <InputContext.Provider value={{ ...state, setFocused, setHasValue, validate }}>
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
  const { disabled, error, setFocused, setHasValue, validate } = context;

  const isEditable = editable !== undefined ? editable && !disabled : !disabled;

  useEffect(() => {
    if (value !== undefined) {
      validate(value);
      setHasValue(value.length > 0);
    } else if (defaultValue !== undefined) {
      validate(defaultValue);
      setHasValue(defaultValue.length > 0);
    }
  }, [value, defaultValue, validate, setHasValue]);

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
    validate(text);
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

type InputPasteButtonProps = Omit<ComponentProps<typeof Pressable>, 'style'> & {
  onPaste: (text: string) => void;
  style?: StyleProp<ViewStyle> | ((state: InputState) => StyleProp<ViewStyle>);
};

const PasteButton = ({ style, onPaste, children, ...props }: InputPasteButtonProps) => {
  const context = useInputContext();
  if (context.hasValue) return null;

  const handlePaste = async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      const text = await Clipboard.getStringAsync();
      if (text) {
        onPaste(text);
      }
    } catch {
      // Ignore or log error
    }
  };

  return (
    <Pressable
      {...props}
      onPress={handlePaste}
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
  const text = context.errorMessage || context.warningMessage || props.children;
  if (!text) return null;

  return (
    <Text role="alert" aria-invalid={context.error} {...props} style={typeof style === 'function' ? style(context) : style}>
      {text}
    </Text>
  );
};

export const Input = Object.assign(Root, { Root, Field, Label, Affix, ClearButton, PasteButton, PasswordToggle, Feedback, useContext: useInputContext });
export default Input;
