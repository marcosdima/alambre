import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
  useSharedValue,
  withSpring,
  cancelAnimation,
  useReducedMotion,
  type SharedValue,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { kinetics } from '../core/kinetics';

export interface KineticTabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
  badgeTone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  disabled?: boolean;
  icon?: any;
}

export interface TabMeasurement {
  x: number;
  width: number;
}

export interface UseKineticTabsOptions<T extends string = string> {
  tabs: readonly KineticTabItem<T>[];
  activeTab?: T;
  initialTab?: T;
  onChange?: (tabId: T) => void;
  springConfig?: WithSpringConfig;
  forceReducedMotion?: boolean;
}

export interface UseKineticTabsReturn<T extends string = string> {
  activeTab: T;
  setActiveTab: (tabId: T) => void;
  indicatorOffset: SharedValue<number>;
  indicatorWidth: SharedValue<number>;
  onTabLayout: (tabId: T, event: LayoutChangeEvent) => void;
  onContainerLayout: (event: LayoutChangeEvent) => void;
  getTabProps: (tab: KineticTabItem<T>) => {
    key: string;
    accessibilityRole: 'tab';
    accessibilityState: { selected: boolean; disabled: boolean };
    onPress: () => void;
    onLayout: (e: LayoutChangeEvent) => void;
    disabled?: boolean;
  };
  getTabListProps: () => {
    accessibilityRole: 'tablist';
  };
}

export function useKineticTabs<T extends string = string>({
  tabs,
  activeTab: controlledActiveTab,
  initialTab,
  onChange,
  springConfig = kinetics.spring.snap,
  forceReducedMotion,
}: UseKineticTabsOptions<T>): UseKineticTabsReturn<T> {
  const isControlled = controlledActiveTab !== undefined;
  const firstTabId = tabs[0]?.id;
  const [internalActiveTab, setInternalActiveTab] = useState<T>(
    initialTab ?? firstTabId ?? ('' as T),
  );

  const effectiveActiveTab = isControlled ? controlledActiveTab : internalActiveTab;

  const reducedMotionPref = useReducedMotion();
  const isReduced = Boolean(forceReducedMotion || reducedMotionPref);

  const indicatorOffset = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const hasInitialized = useRef(false);

  const measurements = useRef<Map<T, TabMeasurement>>(new Map());
  const callbacksRef = useRef({ onChange, springConfig });
  callbacksRef.current = { onChange, springConfig };

  const snapToTab = useCallback(
    (tabId: T, immediate = false) => {
      const measurement = measurements.current.get(tabId);
      if (!measurement) return;

      if (immediate || isReduced) {
        cancelAnimation(indicatorOffset);
        cancelAnimation(indicatorWidth);
        indicatorOffset.value = measurement.x;
        indicatorWidth.value = measurement.width;
      } else {
        const config = callbacksRef.current.springConfig;
        indicatorOffset.value = withSpring(measurement.x, config);
        indicatorWidth.value = withSpring(measurement.width, config);
      }
    },
    [indicatorOffset, indicatorWidth, isReduced],
  );

  const onTabLayout = useCallback(
    (tabId: T, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      measurements.current.set(tabId, { x, width });

      if (tabId === effectiveActiveTab) {
        snapToTab(tabId, !hasInitialized.current);
        hasInitialized.current = true;
      }
    },
    [effectiveActiveTab, snapToTab],
  );

  const onContainerLayout = useCallback((_event: LayoutChangeEvent) => {
    // Allows container boundary tracking if needed
  }, []);

  const setActiveTab = useCallback(
    (nextTabId: T) => {
      if (nextTabId === effectiveActiveTab) return;
      const targetTab = tabs.find((t) => t.id === nextTabId);
      if (targetTab?.disabled) return;

      if (!isControlled) {
        setInternalActiveTab(nextTabId);
      }
      callbacksRef.current.onChange?.(nextTabId);
      snapToTab(nextTabId, false);
    },
    [effectiveActiveTab, isControlled, snapToTab, tabs],
  );

  useEffect(() => {
    if (measurements.current.has(effectiveActiveTab)) {
      snapToTab(effectiveActiveTab, !hasInitialized.current);
      hasInitialized.current = true;
    }
  }, [effectiveActiveTab, snapToTab]);

  useEffect(() => {
    return () => {
      cancelAnimation(indicatorOffset);
      cancelAnimation(indicatorWidth);
    };
  }, [indicatorOffset, indicatorWidth]);

  const getTabProps = useCallback(
    (tab: KineticTabItem<T>) => {
      const isSelected = tab.id === effectiveActiveTab;
      return {
        key: tab.id,
        accessibilityRole: 'tab' as const,
        accessibilityState: {
          selected: isSelected,
          disabled: Boolean(tab.disabled),
        },
        onPress: () => setActiveTab(tab.id),
        onLayout: (e: LayoutChangeEvent) => onTabLayout(tab.id, e),
        disabled: tab.disabled,
      };
    },
    [effectiveActiveTab, onTabLayout, setActiveTab],
  );

  const getTabListProps = useCallback(() => {
    return {
      accessibilityRole: 'tablist' as const,
    };
  }, []);

  return {
    activeTab: effectiveActiveTab,
    setActiveTab,
    indicatorOffset,
    indicatorWidth,
    onTabLayout,
    onContainerLayout,
    getTabProps,
    getTabListProps,
  };
}
