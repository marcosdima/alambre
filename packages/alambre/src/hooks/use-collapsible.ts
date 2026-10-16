import { useCallback, useEffect, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type CollapsibleTransitionType = 'spring' | 'timing';

export type CollapsibleSpringConfig = {
  damping?: number;
  stiffness?: number;
  mass?: number;
};

export type UseCollapsibleOptions = {
  /**
   * Controlled expanded state.
   */
  expanded?: boolean;
  /**
   * Initial state when uncontrolled.
   * @default false
   */
  defaultExpanded?: boolean;
  /**
   * Callback fired when expanded state changes.
   */
  onToggle?: (expanded: boolean) => void;
  /**
   * Animation transition type: 'spring' for tactile physics, 'timing' for linear/cubic curves.
   * @default 'spring'
   */
  transitionType?: CollapsibleTransitionType;
  /**
   * Spring physics parameters when transitionType is 'spring'.
   */
  springConfig?: CollapsibleSpringConfig;
  /**
   * Duration in ms when transitionType is 'timing'.
   * @default 240
   */
  duration?: number;
};

export type UseCollapsibleReturn = {
  /**
   * Current boolean expanded state.
   */
  isExpanded: boolean;
  /**
   * Toggle the expansion state.
   */
  toggle: () => void;
  /**
   * Set expansion state explicitly.
   */
  setExpanded: (expanded: boolean) => void;
  /**
   * Latest measured height of inner content in pixels.
   */
  measuredHeight: number;
  /**
   * Layout callback to attach to the inner content view.
   */
  handleContentLayout: (event: LayoutChangeEvent) => void;
  /**
   * Reanimated SharedValue representing animation progress (0 = collapsed, 1 = fully open).
   */
  progress: SharedValue<number>;
  /**
   * Animated style to apply to the collapsible container view.
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle<{ height: number | undefined; overflow: 'hidden'; }>>;
  /**
   * Helper props to spread onto an off-screen measurement probe container.
   */
  probeProps: {
    pointerEvents: 'none';
    style: {
      position: 'absolute';
      top: -9999;
      left: 0;
      right: 0;
      opacity: 0;
    };
    onLayout: (event: LayoutChangeEvent) => void;
  };
};

/**
 * Headless hook for collapsible content (accordions, disclosure sections, expandable cards).
 * Handles off-screen height measurement, spring/timing interpolation, and reduced motion.
 */
export function useCollapsible(options: UseCollapsibleOptions = {}): UseCollapsibleReturn {
  const {
    expanded: controlledExpanded,
    defaultExpanded = false,
    onToggle,
    transitionType = 'spring',
    springConfig,
    duration = 240,
  } = options;

  const isControlled = controlledExpanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState<boolean>(defaultExpanded);
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const [measuredHeight, setMeasuredHeight] = useState<number>(0);
  const isReducedMotion = useReducedMotion();
  const progress = useSharedValue<number>(isExpanded ? 1 : 0);

  const setExpanded = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalExpanded(next);
      }
      onToggle?.(next);
    },
    [isControlled, onToggle],
  );

  const toggle = useCallback(() => {
    setExpanded(!isExpanded);
  }, [isExpanded, setExpanded]);

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = Math.round(event.nativeEvent.layout.height);
      if (height > 0 && height !== measuredHeight) {
        setMeasuredHeight(height);
      }
    },
    [measuredHeight],
  );

  useEffect(() => {
    if (isReducedMotion) {
      progress.value = isExpanded ? 1 : 0;
      return;
    }

    if (transitionType === 'timing') {
      progress.value = withTiming(isExpanded ? 1 : 0, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = withSpring(isExpanded ? 1 : 0, {
        damping: springConfig?.damping ?? 20,
        stiffness: springConfig?.stiffness ?? 240,
        mass: springConfig?.mass ?? 0.8,
      });
    }
  }, [isExpanded, transitionType, duration, springConfig, isReducedMotion, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    if (measuredHeight === 0) {
      return {
        height: isExpanded ? undefined : 0,
        overflow: 'hidden' as const,
      };
    }

    return {
      height: Math.max(0, progress.value * measuredHeight),
      overflow: 'hidden' as const,
    };
  }, [measuredHeight, isExpanded, progress]);

  return {
    isExpanded,
    toggle,
    setExpanded,
    measuredHeight,
    handleContentLayout,
    progress,
    animatedStyle,
    probeProps: {
      pointerEvents: 'none' as const,
      style: {
        position: 'absolute' as const,
        top: -9999,
        left: 0,
        right: 0,
        opacity: 0,
      },
      onLayout: handleContentLayout,
    },
  };
}
