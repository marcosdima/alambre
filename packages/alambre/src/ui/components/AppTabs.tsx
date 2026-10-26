import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  useKineticTabs,
  type KineticTabItem,
  type UseKineticTabsOptions,
} from '../../hooks/use-kinetic-tabs';
import { useTheme, resolveTypography } from '../theme';
import AppBadge from './AppBadge';

export interface AppTabItem<T extends string = string> extends KineticTabItem<T> {
  content?: React.ReactNode;
}

export interface AppTabsProps<T extends string = string>
  extends Omit<UseKineticTabsOptions<T>, 'tabs'> {
  tabs: readonly AppTabItem<T>[];
  label?: string;
  variant?: 'pill' | 'segmented';
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export default function AppTabs<T extends string = string>({
  tabs,
  activeTab,
  initialTab,
  onChange,
  springConfig,
  forceReducedMotion,
  label,
  variant = 'pill',
  size = 'md',
  containerStyle,
  contentStyle,
}: AppTabsProps<T>) {
  const { theme } = useTheme();
  const labelTypography = resolveTypography(theme, { weight: '600' });

  const {
    activeTab: currentTab,
    indicatorOffset,
    indicatorWidth,
    getTabProps,
    getTabListProps,
  } = useKineticTabs<T>({
    tabs,
    activeTab,
    initialTab,
    onChange,
    springConfig,
    forceReducedMotion,
  });

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: indicatorOffset.value }],
      width: indicatorWidth.value,
    };
  });

  const activeContent = tabs.find((t) => t.id === currentTab)?.content;

  const sizeStyles = {
    sm: { paddingVertical: 5, paddingHorizontal: 10, fontSize: 12 },
    md: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 14 },
    lg: { paddingVertical: 11, paddingHorizontal: 18, fontSize: 16 },
  }[size];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.muted }, labelTypography]}>
          {label}
        </Text>
      )}

      <View
        {...getTabListProps()}
        style={[
          styles.tabList,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: theme.border,
          },
          variant === 'pill' ? styles.pillList : styles.segmentedList,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            variant === 'pill' ? styles.pillIndicator : styles.segmentedIndicator,
            indicatorAnimatedStyle,
          ]}
        />

        {tabs.map((tab) => {
          const { key: _tabKey, ...tabProps } = getTabProps(tab);
          const isSelected = tab.id === currentTab;

          return (
            <Pressable
              key={tab.id}
              {...tabProps}
              style={[
                styles.tabItem,
                {
                  paddingVertical: sizeStyles.paddingVertical,
                  paddingHorizontal: sizeStyles.paddingHorizontal,
                },
                tab.disabled && styles.disabledTab,
              ]}
            >
              {tab.icon && (
                <View style={styles.tabIcon}>
                  {tab.icon}
                </View>
              )}

              <Text
                style={[
                  styles.tabText,
                  {
                    fontSize: sizeStyles.fontSize,
                    color: isSelected
                      ? theme.primary
                      : tab.disabled
                        ? theme.muted
                        : theme.color,
                  },
                  resolveTypography(theme, { weight: isSelected ? '700' : '500' }),
                ]}
              >
                {tab.label}
              </Text>

              {tab.badge !== undefined && (
                <AppBadge
                  variant={isSelected ? 'solid' : 'soft'}
                  tone={tab.badgeTone ?? (isSelected ? 'primary' : 'neutral')}
                  size="sm"
                >
                  {tab.badge}
                </AppBadge>
              )}
            </Pressable>
          );
        })}
      </View>

      {activeContent && (
        <View style={[styles.contentContainer, contentStyle]}>
          {activeContent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  tabList: {
    flexDirection: 'row',
    borderWidth: 1,
    padding: 3,
    position: 'relative',
    alignItems: 'center',
  },
  pillList: {
    borderRadius: 999,
  },
  segmentedList: {
    borderRadius: 12,
  },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  pillIndicator: {
    borderRadius: 999,
  },
  segmentedIndicator: {
    borderRadius: 9,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabText: {
    textAlign: 'center',
  },
  disabledTab: {
    opacity: 0.4,
  },
  contentContainer: {
    marginTop: 8,
  },
});
