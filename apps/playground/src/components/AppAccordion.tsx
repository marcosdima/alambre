import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../providers/theme';
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
  animationType?: 'timing' | 'spring';
  springConfig?: { damping?: number; stiffness?: number; mass?: number };
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
  const { theme } = useLightDark();
  const isReducedMotion = useReducedMotion();

  const isControlled = controlledExpanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const [measuredHeight, setMeasuredHeight] = useState(0);
  const progress = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    if (isReducedMotion) {
      progress.value = isExpanded ? 1 : 0;
      return;
    }

    if (animationType === 'spring') {
      progress.value = withSpring(isExpanded ? 1 : 0, {
        damping: springConfig?.damping ?? 24,
        stiffness: springConfig?.stiffness ?? 180,
        mass: springConfig?.mass ?? 1,
      });
    } else {
      progress.value = withTiming(isExpanded ? 1 : 0, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [
    isExpanded,
    duration,
    animationType,
    springConfig?.damping,
    springConfig?.stiffness,
    springConfig?.mass,
    isReducedMotion,
    progress,
  ]);

  const handlePress = () => {
    if (disabled) return;
    const nextState = !isExpanded;
    if (!isControlled) {
      setInternalExpanded(nextState);
    }
    onToggle?.(nextState);
  };

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const clampedProgress = Math.max(0, progress.value);
    return {
      height: measuredHeight > 0 ? clampedProgress * measuredHeight : undefined,
      opacity: Math.max(0, Math.min(1, progress.value)),
    };
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
        onPress={handlePress}
        disabled={disabled}
        style={[styles.header, headerStyle]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: disabled ? theme.muted : theme.color },
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
            <Text style={[styles.subtitle, { color: theme.muted }]}>
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
      <View
        style={styles.measureProbe}
        pointerEvents="none"
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && h !== measuredHeight) {
            setMeasuredHeight(h);
          }
        }}
      >
        <View style={[styles.contentInner, contentStyle]}>{children}</View>
      </View>

      {/* Active animated container */}
      <Animated.View
        style={[styles.animatedContent, contentAnimatedStyle]}
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
    fontWeight: '700',
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
