import type { ComponentProps, ReactNode } from 'react';
import type { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, resolveTypography, type TypographyWeight } from '../theme';
export type TitleLevel = 1 | 2 | 3;
export type TitleBadgeTone = 'primary' | 'neutral' | 'success' | 'danger' | 'warning';

export type AppTitleProps = Omit<ComponentProps<typeof Text>, 'style'> & {
  level?: TitleLevel;
  weight?: TypographyWeight;
  subtitle?: ReactNode;
  badge?: ReactNode;
  badgeTone?: TitleBadgeTone;
  align?: 'left' | 'center' | 'right';
  color?: ColorValue;
  fontFamily?: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
};

export default function AppTitle({
  level = 2,
  weight,
  subtitle,
  badge,
  badgeTone = 'primary',
  align = 'left',
  color,
  fontFamily,
  style,
  containerStyle,
  subtitleStyle,
  children,
  ...props
}: AppTitleProps) {
  const { theme } = useTheme();

  const getLevelStyles = () => {
    switch (level) {
      case 1:
        return {
          fontSize: 28,
          lineHeight: 34,
          letterSpacing: -0.5,
          weight: '800' as const,
        };
      case 3:
        return {
          fontSize: 17,
          lineHeight: 22,
          letterSpacing: 0,
          weight: '700' as const,
        };
      case 2:
      default:
        return {
          fontSize: 22,
          lineHeight: 28,
          letterSpacing: -0.3,
          weight: '700' as const,
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
  const titleTypography = resolveTypography(theme, {
    weight: weight ?? levelStyles.weight,
    fontFamilyOverride: fontFamily,
    style,
  });
  const badgeTypography = resolveTypography(theme, {
    weight: '800',
    fontFamilyOverride: fontFamily,
  });
  const subtitleTypography = resolveTypography(theme, {
    weight: 'normal',
    fontFamilyOverride: fontFamily,
    style: subtitleStyle,
  });

  // If simple title with no compound elements, render inline
  const titleElement = (
    <Text
      {...props}
      style={[
        {
          fontSize: levelStyles.fontSize,
          lineHeight: levelStyles.lineHeight,
          letterSpacing: levelStyles.letterSpacing,
          color: color ?? theme.color,
          textAlign: align,
        },
        style,
        titleTypography,
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
              <Text style={[styles.badgeText, { color: badgeColors.text }, badgeTypography]}>{badge}</Text>
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
              subtitleTypography,
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
  weight?: TypographyWeight;
  color?: ColorValue;
  fontFamily?: string;
};

export function AppText({
  variant = 'body',
  weight,
  color,
  fontFamily,
  style,
  children,
  ...props
}: AppTextProps) {
  const { theme } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'caption':
        return {
          fontSize: 11,
          lineHeight: 15,
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
  const typography = resolveTypography(theme, {
    weight: weight ?? (variant === 'caption' ? '700' : 'normal'),
    mono: variant === 'code',
    fontFamilyOverride: fontFamily,
    style,
  });

  return (
    <Text
      {...props}
      style={[
        variantStyle,
        color ? { color } : null,
        style,
        typography,
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
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
