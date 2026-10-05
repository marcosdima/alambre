import type { ComponentProps, ReactNode } from 'react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type {
  StyleProp,
  TextStyle,
  ViewStyle,
  TextInput,
} from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AlambreIcons, Input, kinetics } from 'alambre';
import { useLightDark } from '../providers/theme';

export type InputVariant = 'outline' | 'soft' | 'underlined';
export type InputTone = 'default' | 'success' | 'warning' | 'danger';
export type InputSize = 'sm' | 'md' | 'lg';

export type AppTextInputProps = Omit<ComponentProps<typeof TextInput>, 'style'> & {
  label?: string;
  required?: boolean;
  helperText?: string;
  errorMessage?: string;
  variant?: InputVariant;
  tone?: InputTone;
  size?: InputSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  clearable?: boolean;
  isPassword?: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  shellStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
};

const AppTextInput = forwardRef<TextInput, AppTextInputProps>(function AppTextInput({
  label,
  required = false,
  helperText,
  errorMessage,
  variant = 'outline',
  tone = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  clearable = false,
  isPassword = false,
  disabled = false,
  value,
  defaultValue,
  onChangeText,
  onFocus,
  onBlur,
  editable,
  multiline = false,
  numberOfLines = 1,
  placeholderTextColor,
  containerStyle,
  shellStyle,
  style,
  ...props
}: AppTextInputProps, ref) {
  const { theme } = useLightDark();
  const innerRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => innerRef.current as TextInput);

  const [currentText, setCurrentText] = useState(value ?? defaultValue ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const focusProgress = useSharedValue(0);

  const isControlled = value !== undefined;
  const textValue = isControlled ? value : currentText;
  const hasContent = Boolean(textValue && textValue.length > 0);
  const isEditable = editable !== undefined ? editable && !disabled : !disabled;

  const effectiveTone: InputTone = errorMessage ? 'danger' : tone;

  const handleFocus: ComponentProps<typeof TextInput>['onFocus'] = (e) => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, kinetics.timing.fast);
    onFocus?.(e);
  };

  const handleBlur: ComponentProps<typeof TextInput>['onBlur'] = (e) => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, kinetics.timing.fast);
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    if (!isControlled) {
      setCurrentText(text);
    }
    onChangeText?.(text);
  };

  const handleClear = () => {
    if (!isControlled) {
      setCurrentText('');
    }
    onChangeText?.('');
    innerRef.current?.focus();
  };

  // Tone colors resolution
  const getToneColors = () => {
    switch (effectiveTone) {
      case 'danger':
        return {
          blurBorder: '#ef444480',
          focusBorder: '#ef4444',
          accent: '#ef4444',
        };
      case 'warning':
        return {
          blurBorder: '#f59e0b80',
          focusBorder: '#f59e0b',
          accent: '#f59e0b',
        };
      case 'success':
        return {
          blurBorder: '#10b98180',
          focusBorder: '#10b981',
          accent: '#10b981',
        };
      case 'default':
      default:
        return {
          blurBorder: variant === 'soft' ? 'transparent' : theme.border,
          focusBorder: theme.primary,
          accent: theme.primary,
        };
    }
  };

  const toneConfig = getToneColors();

  // Animated border color style
  const animatedBorder = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [toneConfig.blurBorder, toneConfig.focusBorder],
    );

    if (variant === 'underlined') {
      return { borderBottomColor: borderColor };
    }
    return { borderColor };
  });

  // Sizing tokens
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          minHeight: 36,
          paddingHorizontal: variant === 'underlined' ? 0 : 10,
          paddingVertical: 6,
          fontSize: 13,
          borderRadius: variant === 'underlined' ? 0 : 10,
          iconSize: 16,
          gap: 8,
        };
      case 'lg':
        return {
          minHeight: 54,
          paddingHorizontal: variant === 'underlined' ? 0 : 16,
          paddingVertical: 14,
          fontSize: 16,
          borderRadius: variant === 'underlined' ? 0 : 14,
          iconSize: 20,
          gap: 12,
        };
      case 'md':
      default:
        return {
          minHeight: 46,
          paddingHorizontal: variant === 'underlined' ? 0 : 14,
          paddingVertical: 10,
          fontSize: 14,
          borderRadius: variant === 'underlined' ? 0 : 12,
          iconSize: 18,
          gap: 10,
        };
    }
  };

  const sizeConfig = getSizeStyles();

  // Variant background tokens
  const getBackgroundColor = () => {
    if (variant === 'soft') {
      return isFocused ? theme.surface : theme.surfaceAlt;
    }
    if (variant === 'underlined') {
      return 'transparent';
    }
    return theme.surface;
  };

  return (
    <Input.Root
      disabled={disabled}
      error={!!errorMessage}
      hasValue={hasContent}
      style={[styles.container, containerStyle]}
    >
      {/* Label Lockup */}
      {label ? (
        <View style={styles.labelRow}>
          <Input.Label style={[styles.label, { color: isFocused ? toneConfig.accent : theme.color }]}>
            {label}
          </Input.Label>
          {required ? <Text style={styles.requiredAsterisk}>*</Text> : null}
        </View>
      ) : null}

      {/* Input Shell */}
      <Pressable
        onPress={() => innerRef.current?.focus()}
        accessible={false}
      >
        <Animated.View
          style={[
            styles.shell,
            animatedBorder,
            {
              backgroundColor: getBackgroundColor(),
              minHeight: multiline ? sizeConfig.minHeight * 1.8 : sizeConfig.minHeight,
              paddingHorizontal: sizeConfig.paddingHorizontal,
              paddingVertical: sizeConfig.paddingVertical,
              borderRadius: sizeConfig.borderRadius,
              gap: sizeConfig.gap,
              borderWidth: variant === 'underlined' ? 0 : 1.5,
              borderBottomWidth: variant === 'underlined' ? 2 : 1.5,
            },
            disabled && styles.disabledShell,
            multiline && styles.multilineShell,
            shellStyle,
          ]}
        >
          {leftIcon ? <Input.Affix style={styles.iconSlot}>{leftIcon}</Input.Affix> : null}

          <Input.Field
            ref={innerRef}
            value={textValue}
            editable={isEditable}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            secureTextEntry={isPassword && !showPassword}
            multiline={multiline}
            numberOfLines={numberOfLines}
            placeholderTextColor={placeholderTextColor ?? theme.muted}
            accessibilityLabel={props.accessibilityLabel ?? label}
            style={[
              styles.textInput,
              {
                fontSize: sizeConfig.fontSize,
                color: theme.color,
              },
              multiline && styles.multilineInput,
              style,
            ]}
            {...props}
          />

          {/* Clear button slot */}
          {clearable && isEditable ? (
            <Input.ClearButton
              onClear={handleClear}
              hitSlop={8}
              accessibilityLabel="Clear text"
              accessibilityRole="button"
              style={styles.iconButton}
            >
              <AlambreIcons.CircleX
                drawIt
                color={theme.muted}
                lineWidth={2}
                style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}
              />
            </Input.ClearButton>
          ) : null}

          {/* Password toggle slot */}
          {isPassword && isEditable ? (
            <Input.PasswordToggle
              isSecure={isPassword && !showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              hitSlop={8}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
              style={styles.iconButton}
            >
              {showPassword ? (
                <AlambreIcons.Eye
                  drawIt
                  color={theme.primary}
                  lineWidth={2}
                  style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}
                />
              ) : (
                <AlambreIcons.EyeOff
                  drawIt
                  color={theme.muted}
                  lineWidth={2}
                  style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}
                />
              )}
            </Input.PasswordToggle>
          ) : null}

          {rightIcon && !isPassword ? (
            <Input.Affix style={styles.iconSlot}>{rightIcon}</Input.Affix>
          ) : null}
        </Animated.View>
      </Pressable>

      {/* Helper text or Error message */}
      {errorMessage ? (
        <View style={styles.feedbackRow}>
          <AlambreIcons.TriangleAlert
            drawIt
            color="#ef4444"
            lineWidth={2}
            style={styles.feedbackIcon}
          />
          <Input.Feedback style={[styles.feedbackText, { color: '#ef4444' }]}>{errorMessage}</Input.Feedback>
        </View>
      ) : helperText ? (
        <Input.Feedback style={[styles.helperText, { color: theme.muted }]}>{helperText}</Input.Feedback>
      ) : null}
    </Input.Root>
  );
});

export default AppTextInput;

const styles = StyleSheet.create({
  container: {
    gap: 6,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  requiredAsterisk: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  multilineShell: {
    alignItems: 'flex-start',
  },
  disabledShell: {
    opacity: 0.5,
  },
  textInput: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  feedbackIcon: {
    width: 14,
    height: 14,
  },
  feedbackText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});
