import AppText from './AppText';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet,  View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AlambreIcons, kinetics } from 'alambre';
import { useLightDark } from '../providers/theme';
import AppBadge from './AppBadge';
import type { BadgeTone } from './AppBadge';

export type CardVariant = 'outlined' | 'elevated' | 'soft';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type BadgePosition = 'right' | 'inline';

export type AppCardProps = {
  variant?: CardVariant;
  padding?: CardPadding;
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  badgeTone?: BadgeTone;
  badgePosition?: BadgePosition;
  headerAction?: ReactNode;
  footer?: ReactNode;
  chevron?: boolean;
  selected?: boolean;
  onPress?: () => void;
  interactive?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export default function AppCard({
  variant = 'outlined',
  padding = 'md',
  title,
  subtitle,
  badge,
  badgeTone = 'primary',
  badgePosition = 'right',
  headerAction,
  footer,
  chevron = false,
  selected = false,
  onPress,
  interactive = false,
  disabled = false,
  accessibilityLabel,
  style,
  contentStyle,
  headerStyle,
  bodyStyle,
  footerStyle,
  children,
}: AppCardProps) {
  const { theme } = useLightDark();
  const scale = useSharedValue(1);

  const isInteractive = (Boolean(onPress) || Boolean(interactive)) && !disabled;

  const handlePressIn = () => {
    if (!isInteractive) return;
    scale.value = withTiming(0.98, kinetics.timing.fast);
  };

  const handlePressOut = () => {
    if (!isInteractive) return;
    scale.value = withSpring(1, kinetics.spring.stiff);
  };

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getPaddingValue = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return 12;
      case 'lg':
        return 22;
      case 'md':
      default:
        return 16;
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        };
      case 'soft':
        return {
          backgroundColor: selected ? theme.primarySoft : theme.surfaceAlt,
          borderColor: selected ? theme.primary : 'transparent',
          borderWidth: 1.5,
        };
      case 'outlined':
      default:
        return {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1.5,
        };
    }
  };

  const paddingVal = getPaddingValue();
  const variantStyles = getVariantStyles();

  const hasHeader = Boolean(title || subtitle || badge || headerAction || chevron);

  const cardContent = (
    <Animated.View
      style={[
        styles.cardBase,
        variantStyles,
        {
          padding: paddingVal,
          borderRadius: 18,
          overflow: variant === 'elevated' ? 'visible' : 'hidden',
        },
        animatedScaleStyle,
        disabled && styles.disabled,
        !onPress && !interactive && style,
        contentStyle,
      ]}
    >
      {/* Optional Structured Header */}
      {hasHeader && (
        <View style={[styles.headerRow, headerStyle]}>
          <View style={styles.titleColumn}>
            {badgePosition === 'inline' ? (
              <View style={styles.titleBadgeRow}>
                {typeof title === 'string' ? (
                  <AppText style={[styles.titleText, { color: theme.color }]}>
                    {title}
                  </AppText>
                ) : (
                  title
                )}

                {badge ? (
                  typeof badge === 'string' ? (
                    <AppBadge
                      label={badge}
                      tone={badgeTone}
                      size="sm"
                      style={styles.headerBadge}
                    />
                  ) : (
                    badge
                  )
                ) : null}
              </View>
            ) : typeof title === 'string' ? (
              <AppText style={[styles.titleText, { color: theme.color }]}>
                {title}
              </AppText>
            ) : (
              title
            )}

            {subtitle ? (
              typeof subtitle === 'string' ? (
                <AppText style={[styles.subtitleText, { color: theme.muted }]}>
                  {subtitle}
                </AppText>
              ) : (
                subtitle
              )
            ) : null}
          </View>

          {/* Right Header Slot */}
          <View style={styles.headerRightSlot}>
            {badge && badgePosition === 'right' ? (
              typeof badge === 'string' ? (
                <AppBadge
                  label={badge}
                  tone={badgeTone}
                  size="sm"
                  style={styles.headerBadge}
                />
              ) : (
                badge
              )
            ) : null}
            {headerAction}
            {chevron && (
              <AlambreIcons.Arrow
                drawIt
                color={selected ? theme.primary : theme.muted}
                lineWidth={2}
                style={styles.chevronIcon}
              />
            )}
          </View>
        </View>
      )}

      {/* Body Content */}
      {children ? (
        <View style={[styles.body, hasHeader && styles.bodyWithHeader, bodyStyle]}>
          {children}
        </View>
      ) : null}

      {/* Optional Structured Footer */}
      {footer ? (
        <View style={[styles.footer, { borderTopColor: theme.border }, footerStyle]}>
          {footer}
        </View>
      ) : null}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected, disabled }}
        style={style}
      >
        {cardContent}
      </Pressable>
    );
  }

  if (interactive) {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected, disabled }}
        style={style}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  cardBase: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
    gap: 3,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  titleText: {
    fontSize: 16,

    letterSpacing: -0.2,
    flexShrink: 1,
    includeFontPadding: false,
  },
  headerBadge: {
    alignSelf: 'center',
  },
  subtitleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  headerRightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  chevronIcon: {
    width: 16,
    height: 16,
  },
  body: {
    width: '100%',
  },
  bodyWithHeader: {
    marginTop: 10,
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
