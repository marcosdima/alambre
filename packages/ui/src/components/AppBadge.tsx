import type { ComponentProps, ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AlambreIcons, usePressKinetics } from 'alambre';
import { useTheme } from '../theme';

export type BadgeTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger';
export type BadgeVariant = 'soft' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md';

export type AppBadgeProps = ComponentProps<typeof View> & {
  label?: ReactNode;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  textStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
};

export default function AppBadge({
  label,
  tone = 'primary',
  variant = 'soft',
  size = 'md',
  icon,
  style,
  textStyle,
  children,
  ...props
}: AppBadgeProps) {
  const { theme } = useTheme();

  const getToneColors = () => {
    switch (tone) {
      case 'success':
        return {
          accent: '#10b981',
          softBg: '#10b9811a',
          contrast: '#ffffff',
        };
      case 'warning':
        return {
          accent: '#f59e0b',
          softBg: '#f59e0b1a',
          contrast: '#1e1e1e',
        };
      case 'danger':
        return {
          accent: '#ef4444',
          softBg: '#ef44441a',
          contrast: '#ffffff',
        };
      case 'neutral':
        return {
          accent: theme.border,
          softBg: theme.surfaceAlt,
          contrast: theme.color,
        };
      case 'primary':
      default:
        return {
          accent: theme.primary,
          softBg: theme.primarySoft,
          contrast: '#ffffff',
        };
    }
  };

  const colors = getToneColors();

  const getVariantStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
          borderWidth: 1,
          textColor: colors.contrast,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.accent,
          borderWidth: 1,
          textColor: tone === 'neutral' ? theme.color : colors.accent,
        };
      case 'soft':
      default:
        return {
          backgroundColor: colors.softBg,
          borderColor: colors.accent,
          borderWidth: 1,
          textColor: tone === 'neutral' ? theme.color : colors.accent,
        };
    }
  };

  const vStyle = getVariantStyles();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: 7,
          paddingVertical: 2,
          fontSize: 10,
          borderRadius: 6,
          gap: 4,
          iconSize: 10,
        };
      case 'md':
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 3,
          fontSize: 11,
          borderRadius: 8,
          gap: 5,
          iconSize: 12,
        };
    }
  };

  const sStyle = getSizeStyles();
  const content = label ?? children;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: vStyle.backgroundColor,
          borderColor: vStyle.borderColor,
          borderWidth: vStyle.borderWidth,
          paddingHorizontal: sStyle.paddingHorizontal,
          paddingVertical: sStyle.paddingVertical,
          borderRadius: sStyle.borderRadius,
          gap: sStyle.gap,
        },
        style,
      ]}
      {...props}
    >
      {icon}
      {typeof content === 'string' ? (
        <Text
          style={[
            styles.badgeText,
            {
              color: vStyle.textColor,
              fontSize: sStyle.fontSize,
              fontFamily: theme.fontFamily,
            },
            textStyle,
          ]}
        >
          {content}
        </Text>
      ) : (
        content
      )}
    </View>
  );
}

// -------------------------------------------------------------
// Interactive Chip Component
// -------------------------------------------------------------

export type AppChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  icon?: ReactNode;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AppChip({
  label,
  selected = false,
  onPress,
  onRemove,
  icon,
  tone = 'primary',
  size = 'md',
  disabled = false,
  style,
  contentStyle,
}: AppChipProps) {
  const { theme } = useTheme();
  const { animatedStyle: animatedScale, pressProps } = usePressKinetics({
    activeScale: 0.95,
    disabled,
    onPress,
  });

  const activeColor = tone === 'neutral' ? theme.color : theme.primary;
  const isSelected = selected;

  const sizePadding = size === 'sm'
    ? { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, borderRadius: 10 }
    : { paddingHorizontal: 12, paddingVertical: 7, fontSize: 13, borderRadius: 12 };

  return (
    <Pressable
      {...pressProps}
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      hitSlop={4}
      style={style}
    >
      <Animated.View
        style={[
          styles.chip,
          animatedScale,
          {
            paddingHorizontal: sizePadding.paddingHorizontal,
            paddingVertical: sizePadding.paddingVertical,
            borderRadius: sizePadding.borderRadius,
            backgroundColor: isSelected ? theme.primarySoft : theme.surfaceAlt,
            borderColor: isSelected ? activeColor : theme.border,
            borderWidth: 1.5,
          },
          disabled && styles.disabled,
          contentStyle,
        ]}
      >
        {icon}
        <Text
          style={[
            styles.chipText,
            {
              fontSize: sizePadding.fontSize,
              color: isSelected ? activeColor : theme.color,
              fontWeight: isSelected ? '700' : '500',
              fontFamily: theme.fontFamily,
            },
          ]}
        >
          {label}
        </Text>

        {onRemove ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${label}`}
            style={styles.removeSlot}
          >
            <AlambreIcons.Cross
              drawIt
              color={isSelected ? activeColor : theme.muted}
              lineWidth={2}
              style={styles.removeIcon}
            />
          </Pressable>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  chipText: {
    letterSpacing: 0.1,
  },
  removeSlot: {
    paddingLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    width: 12,
    height: 12,
  },
  disabled: {
    opacity: 0.45,
  },
});
