import AppText from './AppText';
import type { ReactNode } from 'react';
import type { GestureResponderEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet  } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { ButtonProps, ButtonState } from 'alambre';
import { Button, kinetics } from 'alambre';
import { useLightDark } from '../providers/theme';

export type ButtonVariant = 'solid' | 'outline' | 'soft' | 'ghost';
export type ButtonTone = 'primary' | 'secondary' | 'neutral' | 'success' | 'danger' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type AppButtonProps = Omit<ButtonProps, 'children'> & {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  children?: ReactNode | ((state: ButtonState) => ReactNode);
};

export default function AppButton({
  variant = 'outline',
  tone = 'primary',
  size = 'md',
  label,
  leftIcon,
  rightIcon,
  iconOnly = false,
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  contentStyle,
  labelStyle,
  children,
  onPressIn,
  onPressOut,
  ...props
}: AppButtonProps) {
  const { theme } = useLightDark();
  const scale = useSharedValue(1);

  const handlePressIn = (event: GestureResponderEvent) => {
    scale.value = withTiming(0.96, kinetics.timing.fast);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    scale.value = withSpring(1, kinetics.spring.stiff);
    onPressOut?.(event);
  };

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getToneColors = () => {
    switch (tone) {
      case 'secondary':
        return { accent: theme.secondary, soft: theme.secondarySoft, contrast: '#ffffff' };
      case 'success':
        return { accent: theme.success, soft: theme.primarySoft, contrast: '#ffffff' };
      case 'danger':
        return { accent: theme.danger, soft: '#ef44441a', contrast: '#ffffff' };
      case 'warning':
        return { accent: theme.warning, soft: theme.sandSoft, contrast: '#1e1e1e' };
      case 'neutral':
        return { accent: theme.border, soft: theme.surfaceAlt, contrast: theme.color };
      case 'primary':
      default:
        return { accent: theme.primary, soft: theme.primarySoft, contrast: theme.onPrimary };
    }
  };

  const toneConfig = getToneColors();

  const getVariantStyles = (pressed: boolean) => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: pressed ? toneConfig.accent : toneConfig.accent,
          borderColor: toneConfig.accent,
          borderWidth: 1.5,
          textColor: toneConfig.contrast,
        };
      case 'soft':
        return {
          backgroundColor: pressed ? theme.surfaceAlt : toneConfig.soft,
          borderColor: 'transparent',
          borderWidth: 1.5,
          textColor: toneConfig.accent === theme.border ? theme.color : toneConfig.accent,
        };
      case 'ghost':
        return {
          backgroundColor: pressed ? theme.surfaceAlt : 'transparent',
          borderColor: 'transparent',
          borderWidth: 1.5,
          textColor: toneConfig.accent === theme.border ? theme.color : toneConfig.accent,
        };
      case 'outline':
      default:
        return {
          backgroundColor: pressed ? theme.surfaceAlt : theme.surface,
          borderColor: toneConfig.accent,
          borderWidth: 1.5,
          textColor: toneConfig.accent === theme.border ? theme.color : toneConfig.accent,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          minHeight: 34,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 10,
          fontSize: 13,
          gap: 6,
        };
      case 'lg':
        return {
          minHeight: 52,
          paddingVertical: 13,
          paddingHorizontal: 22,
          borderRadius: 14,
          fontSize: 16,
          gap: 10,
        };
      case 'md':
      default:
        return {
          minHeight: 44,
          paddingVertical: 10,
          paddingHorizontal: 18,
          borderRadius: 12,
          fontSize: 14,
          gap: 8,
        };
    }
  };

  const sizeConfig = getSizeStyles();

  return (
    <Button
      {...props}
      loading={loading}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={
        typeof style === 'function'
          ? (state) => [fullWidth && styles.fullWidth, style(state)]
          : [fullWidth && styles.fullWidth, style]
      }
    >
      {({ pressed, disabled: isDisabled, loading: isLoading }) => {
        const currentVariant = getVariantStyles(pressed);
        const isBlocked = isDisabled || isLoading;

        return (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shell,
              animatedScaleStyle,
              {
                minHeight: sizeConfig.minHeight,
                paddingVertical: sizeConfig.paddingVertical,
                paddingHorizontal: iconOnly ? 0 : sizeConfig.paddingHorizontal,
                borderRadius: sizeConfig.borderRadius,
                gap: sizeConfig.gap,
                backgroundColor: currentVariant.backgroundColor,
                borderColor: currentVariant.borderColor,
                borderWidth: currentVariant.borderWidth,
              },
              iconOnly && { width: sizeConfig.minHeight, justifyContent: 'center' },
              fullWidth && styles.fullWidth,
              isBlocked && styles.muted,
              contentStyle,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={currentVariant.textColor}
                style={styles.spinner}
              />
            ) : (
              <>
                {leftIcon}
                {label ? (
                  <AppText
                    style={[
                      styles.labelText,
                      {
                        color: currentVariant.textColor,
                        fontSize: sizeConfig.fontSize,
                      },
                      labelStyle,
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </AppText>
                ) : null}
                {typeof children === 'function'
                  ? children({ pressed, disabled: isDisabled, loading: isLoading })
                  : typeof children === 'string'
                    ? (
                      <AppText
                        style={[
                          styles.labelText,
                          {
                            color: currentVariant.textColor,
                            fontSize: sizeConfig.fontSize,
                          },
                          labelStyle,
                        ]}
                        numberOfLines={1}
                      >
                        {children}
                      </AppText>
                    )
                    : children}
                {rightIcon}
              </>
            )}
          </Animated.View>
        );
      }}
    </Button>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  labelText: {

    flexShrink: 1,
  },
  spinner: {
    marginVertical: 2,
  },
  muted: {
    opacity: 0.5,
  },
});

