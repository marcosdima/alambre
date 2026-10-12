import type { ComponentProps, ReactNode } from 'react';
import type { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useLightDark } from '../providers/theme';
import { useConfig } from '../providers/config';

export type TitleLevel = 1 | 2 | 3;
export type TitleBadgeTone = 'primary' | 'neutral' | 'success' | 'danger' | 'warning';

export type AppTitleProps = Omit<ComponentProps<typeof Text>, 'style'> & {
  level?: TitleLevel;
  subtitle?: ReactNode;
  badge?: ReactNode;
  badgeTone?: TitleBadgeTone;
  align?: 'left' | 'center' | 'right';
  color?: ColorValue;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
};

export default function AppTitle({
  level = 2,
  subtitle,
  badge,
  badgeTone = 'primary',
  align = 'left',
  color,
  style,
  containerStyle,
  subtitleStyle,
  children,
  ...props
}: AppTitleProps) {
  const { theme } = useLightDark();
  const { config } = useConfig();

  const getLevelStyles = () => {
    switch (level) {
      case 1:
        return {
          fontSize: 28,
          lineHeight: 34,
          fontWeight: '800' as const,
          letterSpacing: -0.5,
        };
      case 3:
        return {
          fontSize: 17,
          lineHeight: 22,
          fontWeight: '700' as const,
          letterSpacing: 0,
        };
      case 2:
      default:
        return {
          fontSize: 22,
          lineHeight: 28,
          fontWeight: '700' as const,
          letterSpacing: -0.3,
        };
    }
  };

  const getBadgeColors = () => {
    switch (badgeTone) {
      case 'success':
        return { bg: '#10b98120', border: '#10b981', text: '#10b981' };
      case 'danger':
        return { bg: '#ef444420', border: '#ef4444', text: '#ef4444' };
      case 'warning':
        return { bg: '#f59e0b20', border: '#f59e0b', text: '#f59e0b' };
      case 'neutral':
        return { bg: theme.surfaceAlt, border: theme.border, text: theme.muted };
      case 'primary':
      default:
        return { bg: theme.primarySoft, border: theme.primary, text: theme.primary };
    }
  };

  const levelStyles = getLevelStyles();
  const badgeColors = getBadgeColors();

  // If simple title with no compound elements, render inline
  const titleElement = (
    <Text
      {...props}
      style={[
        levelStyles,
        { color: color ?? theme.color, textAlign: align, fontFamily: config.fontFamily },
        style,
      ]}
    >
      {children}
    </Text>
  );

  if (!subtitle && !badge) {
    return titleElement;
  }

  return (
    <View
      style={[
        styles.container,
        align === 'center' && styles.alignCenter,
        align === 'right' && styles.alignRight,
        containerStyle,
      ]}
    >
      <View
        style={[
          styles.row,
          align === 'center' && styles.justifyCenter,
          align === 'right' && styles.justifyRight,
        ]}
      >
        {titleElement}
        {badge ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeColors.bg, borderColor: badgeColors.border },
            ]}
          >
            {typeof badge === 'string' ? (
              <Text style={[styles.badgeText, { color: badgeColors.text }]}>{badge}</Text>
            ) : (
              badge
            )}
          </View>
        ) : null}
      </View>

      {subtitle ? (
        typeof subtitle === 'string' ? (
          <Text
            style={[
              styles.subtitle,
              { color: theme.muted, textAlign: align },
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Text>
        ) : (
          subtitle
        )
      ) : null}
    </View>
  );
}

export type TextVariant = 'body' | 'caption' | 'subtitle' | 'muted' | 'code';
export type AppTextProps = ComponentProps<typeof Text> & {
  variant?: TextVariant;
  color?: ColorValue;
};

export function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...props
}: AppTextProps) {
  const { theme } = useLightDark();
  const { config } = useConfig();

  const getVariantStyle = () => {
    switch (variant) {
      case 'caption':
        return {
          fontSize: 11,
          lineHeight: 15,
          fontWeight: '700' as const,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
          color: theme.muted,
        };
      case 'subtitle':
        return {
          fontSize: 13,
          lineHeight: 18,
          color: theme.muted,
        };
      case 'muted':
        return {
          fontSize: 14,
          lineHeight: 20,
          color: theme.muted,
        };
      case 'code':
        return {
          fontSize: 13,
          lineHeight: 18,
          fontFamily: 'monospace',
          color: theme.primary,
        };
      case 'body':
      default:
        return {
          fontSize: 14,
          lineHeight: 20,
          color: theme.color,
        };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <Text
      {...props}
      style={[
        variantStyle,
        { fontFamily: variant === 'code' ? 'monospace' : config.fontFamily },
        color ? { color } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  justifyRight: {
    justifyContent: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
