import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { AlambreIcons, useCollapsible } from 'alambre';
import type { CollapsibleSpringConfig, CollapsibleTransitionType } from 'alambre';
import { useTheme, resolveTypography } from '../theme';
import AppBadge from './AppBadge';

export type AppAccordionProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  children: ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  duration?: number;
  animationType?: CollapsibleTransitionType;
  springConfig?: CollapsibleSpringConfig;
  rotationAngle?: 90 | 180;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

export default function AppAccordion({
  title,
  subtitle,
  badge,
  badgeTone = 'primary',
  children,
  expanded: controlledExpanded,
  defaultExpanded = false,
  onToggle,
  duration = 240,
  animationType = 'timing',
  springConfig,
  rotationAngle = 180,
  disabled = false,
  style,
  headerStyle,
  contentStyle,
  titleStyle,
}: AppAccordionProps) {
  const { theme } = useTheme();
  const titleTypography = resolveTypography(theme, { weight: '700' });
  const subtitleTypography = resolveTypography(theme, { weight: 'normal' });

  const {
    isExpanded,
    toggle,
    progress,
    animatedStyle: collapsibleStyle,
    probeProps,
  } = useCollapsible({
    expanded: controlledExpanded,
    defaultExpanded,
    onToggle,
    transitionType: animationType,
    springConfig,
    duration,
  });

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * rotationAngle}deg` }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {/* Header Button */}
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: isExpanded, disabled }}
        onPress={disabled ? undefined : toggle}
        disabled={disabled}
        style={[styles.header, headerStyle]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: disabled ? theme.muted : theme.color },
                titleTypography,
                titleStyle,
              ]}
            >
              {title}
            </Text>
            {badge ? (
              <AppBadge label={badge} tone={badgeTone} size="sm" />
            ) : null}
          </View>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.muted }, subtitleTypography]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Animated Chevron Indicator */}
        <Animated.View style={[styles.chevronWrapper, chevronAnimatedStyle]}>
          <AlambreIcons.Arrow
            rotation={rotationAngle === 90 ? 0 : 90}
            color={disabled ? theme.border : theme.muted}
            lineWidth={2.5}
            style={styles.chevronIcon}
          />
        </Animated.View>
      </Pressable>

      {/* Hidden layout measurement probe */}
      <View {...probeProps}>
        <View style={[styles.contentInner, contentStyle]}>{children}</View>
      </View>

      {/* Active animated container */}
      <Animated.View
        style={[styles.animatedContent, collapsibleStyle]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <View style={[styles.contentInner, contentStyle]}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flex: 1,
    gap: 3,
    paddingRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIcon: {
    width: 16,
    height: 16,
  },
  animatedContent: {
    overflow: 'hidden',
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  measureProbe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -1,
  },
});
