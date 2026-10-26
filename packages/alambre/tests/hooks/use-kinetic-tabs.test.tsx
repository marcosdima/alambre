import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { LayoutChangeEvent } from 'react-native';
import { useKineticTabs, type KineticTabItem } from '../../src/hooks/use-kinetic-tabs';

const mockWithSpring = vi.fn((toValue: number, _config?: unknown) => toValue);
const mockCancelAnimation = vi.fn();
let mockReducedMotion = false;

vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  return {
    useReducedMotion: () => mockReducedMotion,
    useSharedValue: (initial: number) => {
      const ref = React.useRef({ value: initial });
      return ref.current;
    },
    useAnimatedStyle: (factory: () => unknown) => factory(),
    withSpring: (toValue: number, config?: unknown) => mockWithSpring(toValue, config),
    cancelAnimation: (val: unknown) => mockCancelAnimation(val),
  };
});

function createLayoutEvent(x: number, width: number, y = 0, height = 36): LayoutChangeEvent {
  return {
    nativeEvent: {
      layout: { x, y, width, height },
    },
  } as LayoutChangeEvent;
}

describe('useKineticTabs hook', () => {
  const sampleTabs: KineticTabItem<string>[] = [
    { id: 'tab-overview', label: 'Overview' },
    { id: 'tab-activity', label: 'Activity', badge: 3 },
    { id: 'tab-settings', label: 'Settings', disabled: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockReducedMotion = false;
  });

  describe('active tab initialization and control', () => {
    it('defaults to first tab when initialTab is not specified', () => {
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
        }),
      );

      expect(result.current.activeTab).toBe('tab-overview');
    });

    it('uses initialTab when specified', () => {
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
          initialTab: 'tab-activity',
        }),
      );

      expect(result.current.activeTab).toBe('tab-activity');
    });

    it('falls back to empty string when tabs array is empty', () => {
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: [],
        }),
      );

      expect(result.current.activeTab).toBe('');
    });

    it('operates in uncontrolled mode and updates activeTab via setActiveTab', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
          onChange,
        }),
      );

      act(() => {
        result.current.setActiveTab('tab-activity');
      });

      expect(result.current.activeTab).toBe('tab-activity');
      expect(onChange).toHaveBeenCalledWith('tab-activity');
    });

    it('ignores setActiveTab if tab is already active', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
          initialTab: 'tab-overview',
          onChange,
        }),
      );

      act(() => {
        result.current.setActiveTab('tab-overview');
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores setActiveTab if target tab is disabled', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
          onChange,
        }),
      );

      act(() => {
        result.current.setActiveTab('tab-settings');
      });

      expect(result.current.activeTab).toBe('tab-overview');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('operates in controlled mode when activeTab prop is provided', () => {
      const onChange = vi.fn();
      let active = 'tab-overview';

      const { result, rerender } = renderHook(
        (props: { activeTab: string }) =>
          useKineticTabs({
            tabs: sampleTabs,
            activeTab: props.activeTab,
            onChange,
          }),
        { initialProps: { activeTab: active } },
      );

      expect(result.current.activeTab).toBe('tab-overview');

      act(() => {
        result.current.setActiveTab('tab-activity');
      });

      // Does not mutate local state directly in controlled mode
      expect(onChange).toHaveBeenCalledWith('tab-activity');
      expect(result.current.activeTab).toBe('tab-overview');

      // Parent updates prop
      rerender({ activeTab: 'tab-activity' });
      expect(result.current.activeTab).toBe('tab-activity');
    });
  });

  describe('onTabLayout and snapToTab mechanics', () => {
    it('snaps immediately without spring on initial layout of active tab', () => {
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
        }),
      );

      expect(result.current.indicatorOffset.value).toBe(0);
      expect(result.current.indicatorWidth.value).toBe(0);

      act(() => {
        result.current.onTabLayout('tab-overview', createLayoutEvent(8, 72));
      });

      expect(result.current.indicatorOffset.value).toBe(8);
      expect(result.current.indicatorWidth.value).toBe(72);
      expect(mockCancelAnimation).toHaveBeenCalled();
      expect(mockWithSpring).not.toHaveBeenCalled();
    });

    it('animates with spring on subsequent tab switches after layout measurements', () => {
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
        }),
      );

      // Measure tabs
      act(() => {
        result.current.onTabLayout('tab-overview', createLayoutEvent(0, 80));
        result.current.onTabLayout('tab-activity', createLayoutEvent(90, 85));
      });

      mockWithSpring.mockClear();

      act(() => {
        result.current.setActiveTab('tab-activity');
      });

      expect(mockWithSpring).toHaveBeenCalledWith(90, expect.anything());
      expect(mockWithSpring).toHaveBeenCalledWith(85, expect.anything());
      expect(result.current.indicatorOffset.value).toBe(90);
      expect(result.current.indicatorWidth.value).toBe(85);
    });

    it('snaps immediately without spring when forceReducedMotion is true', () => {
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
          forceReducedMotion: true,
        }),
      );

      act(() => {
        result.current.onTabLayout('tab-overview', createLayoutEvent(0, 80));
        result.current.onTabLayout('tab-activity', createLayoutEvent(90, 85));
      });

      mockWithSpring.mockClear();
      mockCancelAnimation.mockClear();

      act(() => {
        result.current.setActiveTab('tab-activity');
      });

      expect(mockWithSpring).not.toHaveBeenCalled();
      expect(mockCancelAnimation).toHaveBeenCalled();
      expect(result.current.indicatorOffset.value).toBe(90);
      expect(result.current.indicatorWidth.value).toBe(85);
    });

    it('snaps immediately without spring when system reduced motion is active', () => {
      mockReducedMotion = true;

      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
        }),
      );

      act(() => {
        result.current.onTabLayout('tab-overview', createLayoutEvent(0, 80));
        result.current.onTabLayout('tab-activity', createLayoutEvent(90, 85));
      });

      mockWithSpring.mockClear();

      act(() => {
        result.current.setActiveTab('tab-activity');
      });

      expect(mockWithSpring).not.toHaveBeenCalled();
      expect(result.current.indicatorOffset.value).toBe(90);
      expect(result.current.indicatorWidth.value).toBe(85);
    });

    it('handles onContainerLayout invocation without error', () => {
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
        }),
      );

      expect(() => {
        result.current.onContainerLayout(createLayoutEvent(0, 320, 0, 48));
      }).not.toThrow();
    });
  });

  describe('getTabProps and getTabListProps contracts', () => {
    it('returns tablist accessibility role for container', () => {
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
        }),
      );

      const tabListProps = result.current.getTabListProps();
      expect(tabListProps).toEqual({
        accessibilityRole: 'tablist',
      });
    });

    it('provides accessible props, selected state, and interaction bindings for active tab', () => {
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
        }),
      );

      const overviewProps = result.current.getTabProps(sampleTabs[0]);

      expect(overviewProps.key).toBe('tab-overview');
      expect(overviewProps.accessibilityRole).toBe('tab');
      expect(overviewProps.accessibilityState).toEqual({
        selected: true,
        disabled: false,
      });
      expect(overviewProps.disabled).toBeFalsy();
      expect(typeof overviewProps.onPress).toBe('function');
      expect(typeof overviewProps.onLayout).toBe('function');
    });

    it('marks inactive tab as unselected and switches active tab on press', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
          onChange,
        }),
      );

      const activityTab = sampleTabs[1];
      const activityProps = result.current.getTabProps(activityTab);

      expect(activityProps.accessibilityState).toEqual({
        selected: false,
        disabled: false,
      });

      act(() => {
        activityProps.onPress();
      });

      expect(result.current.activeTab).toBe('tab-activity');
      expect(onChange).toHaveBeenCalledWith('tab-activity');
    });

    it('marks disabled tab correctly and prevents selection on press', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
          onChange,
        }),
      );

      const disabledTab = sampleTabs[2];
      const disabledProps = result.current.getTabProps(disabledTab);

      expect(disabledProps.disabled).toBe(true);
      expect(disabledProps.accessibilityState).toEqual({
        selected: false,
        disabled: true,
      });

      act(() => {
        disabledProps.onPress();
      });

      expect(result.current.activeTab).toBe('tab-overview');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('forwards layout measurement when tab onLayout is invoked', () => {
      const { result } = renderHook(() =>
        useKineticTabs({
          tabs: sampleTabs,
        }),
      );

      const overviewProps = result.current.getTabProps(sampleTabs[0]);

      act(() => {
        overviewProps.onLayout(createLayoutEvent(12, 64));
      });

      expect(result.current.indicatorOffset.value).toBe(12);
      expect(result.current.indicatorWidth.value).toBe(64);
    });
  });
});
