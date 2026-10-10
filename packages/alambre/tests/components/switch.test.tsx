import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Switch from '../../src/components/base/input/switch/Switch';
import { kinetics } from '../../src/core/kinetics';

type ElementNode = {
  props: Record<string, unknown>;
  children: Array<ElementNode | string>;
};

// Mock Reanimated
const mockWithSpring = vi.fn((val: unknown, _config?: unknown) => val);
const mockWithTiming = vi.fn((val: unknown, _config?: unknown) => val);
const mockInterpolateColor = vi.fn(
  (val: number, _inRange: number[], outRange: string[]) => {
    return val >= 1 ? outRange[outRange.length - 1] : outRange[0];
  },
);

vi.mock('react-native-reanimated', async () => {
  const ReactActual = await import('react');
  const { View: RNView } = await import('react-native');
  const ViewComponent = RNView as unknown as React.ComponentType<{
    ref?: unknown;
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
  }>;

  return {
    default: {
      View: ReactActual.forwardRef<
        unknown,
        { children?: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }
      >(({ children, style, ...props }, ref) =>
        ReactActual.createElement(ViewComponent, { ref, style, ...props }, children),
      ),
    },
    useSharedValue: vi.fn((val: unknown) => {
      const ref = ReactActual.useRef({ value: val });
      return ref.current;
    }),
    useAnimatedStyle: vi.fn((cb: () => unknown) => cb()),
    withSpring: (toValue: unknown, config?: unknown) =>
      mockWithSpring(toValue, config),
    withTiming: (toValue: unknown, config?: unknown) =>
      mockWithTiming(toValue, config),
    interpolateColor: (
      progress: number,
      inputRange: number[],
      outputRange: string[],
    ) => mockInterpolateColor(progress, inputRange, outputRange),
  };
});

describe('Switch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders standalone switch with default props', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch checked={false} onChange={onChange} testID="my-switch" />,
      );

      const switchElement = getByTestId('my-switch');
      expect(switchElement).toBeTruthy();
      expect(switchElement.props.accessibilityRole).toBe('switch');
      expect(switchElement.props.hitSlop).toBe(8);
    });

    it('renders with label only', async () => {
      const onChange = vi.fn();
      const { getByText, getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          label="Airplane Mode"
          testID="labeled-switch"
        />,
      );

      expect(getByText('Airplane Mode')).toBeTruthy();
      expect(getByTestId('labeled-switch')).toBeTruthy();
    });

    it('renders with subtitle only', async () => {
      const onChange = vi.fn();
      const { getByText, getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          subtitle="Disable all wireless connections"
          testID="subtitled-switch"
        />,
      );

      expect(getByText('Disable all wireless connections')).toBeTruthy();
      expect(getByTestId('subtitled-switch')).toBeTruthy();
    });

    it('renders with both label and subtitle', async () => {
      const onChange = vi.fn();
      const { getByText, getByTestId } = await render(
        <Switch
          checked={true}
          onChange={onChange}
          label="Bluetooth"
          subtitle="Discover and connect devices"
          testID="bt-switch"
        />,
      );

      expect(getByText('Bluetooth')).toBeTruthy();
      expect(getByText('Discover and connect devices')).toBeTruthy();
      expect(getByTestId('bt-switch')).toBeTruthy();
    });

    it('renders custom labelStyle and subtitleStyle', async () => {
      const onChange = vi.fn();
      const { getByText } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          label="Custom Label"
          subtitle="Custom Subtitle"
          labelStyle={{ color: 'red' }}
          subtitleStyle={{ color: 'blue' }}
        />,
      );

      const labelNode = getByText('Custom Label');
      const subtitleNode = getByText('Custom Subtitle');

      const flatLabelStyle = StyleSheet.flatten<TextStyle>(
        labelNode.props.style as StyleProp<TextStyle>,
      );
      const flatSubtitleStyle = StyleSheet.flatten<TextStyle>(
        subtitleNode.props.style as StyleProp<TextStyle>,
      );

      expect(flatLabelStyle.color).toBe('red');
      expect(flatSubtitleStyle.color).toBe('blue');
    });

    it('applies custom containerStyle and switchStyle in labeled mode', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          label="Notifications"
          containerStyle={{ padding: 12 }}
          switchStyle={{ opacity: 0.8 }}
          testID="styled-switch"
        />,
      );

      const root = getByTestId('styled-switch');
      const flatContainer = StyleSheet.flatten<ViewStyle>(
        root.props.style as StyleProp<ViewStyle>,
      );
      expect(flatContainer.padding).toBe(12);

      const switchWrapper = (root.children as ElementNode[])[1];
      const flatSwitchStyle = StyleSheet.flatten<ViewStyle>(
        switchWrapper.props.style as StyleProp<ViewStyle>,
      );
      expect(flatSwitchStyle.opacity).toBe(0.8);
    });

    it('applies switchStyle in standalone mode', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          switchStyle={{ margin: 10 }}
          testID="standalone-styled"
        />,
      );

      const root = getByTestId('standalone-styled');
      const flatStyle = StyleSheet.flatten<ViewStyle>(
        root.props.style as StyleProp<ViewStyle>,
      );
      expect(flatStyle.margin).toBe(10);
    });

    it.each([
      ['sm', 38, 22, 16],
      ['md', 48, 28, 20],
      ['lg', 56, 34, 26],
    ] as const)(
      'renders correct geometry for size "%s"',
      async (size, trackWidth, trackHeight, thumbSize) => {
        const onChange = vi.fn();
        const { getByTestId } = await render(
          <Switch
            checked={false}
            onChange={onChange}
            size={size}
            testID={`switch-${size}`}
          />,
        );

        const root = getByTestId(`switch-${size}`);
        // First child of Pressable is track Animated.View
        const track = (root.children as ElementNode[])[0];
        const flatTrackStyle = StyleSheet.flatten<ViewStyle>(
          track.props.style as StyleProp<ViewStyle>,
        );
        expect(flatTrackStyle.width).toBe(trackWidth);
        expect(flatTrackStyle.height).toBe(trackHeight);

        // Child of track is thumb Animated.View
        const thumb = (track.children as ElementNode[])[0];
        const flatThumbStyle = StyleSheet.flatten<ViewStyle>(
          thumb.props.style as StyleProp<ViewStyle>,
        );
        expect(flatThumbStyle.width).toBe(thumbSize);
        expect(flatThumbStyle.height).toBe(thumbSize);
      },
    );

    it('applies default and custom thumbColor', async () => {
      const onChange = vi.fn();
      const { getByTestId: getDefault } = await render(
        <Switch checked={false} onChange={onChange} testID="default-thumb" />,
      );

      const defaultRoot = getDefault('default-thumb');
      const defaultTrack = (defaultRoot.children as ElementNode[])[0];
      const defaultThumb = (defaultTrack.children as ElementNode[])[0];
      const defaultStyle = StyleSheet.flatten<ViewStyle>(
        defaultThumb.props.style as StyleProp<ViewStyle>,
      );
      expect(defaultStyle.backgroundColor).toBe('#ffffff');

      const { getByTestId: getColored } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          thumbColor="#ff0000"
          testID="colored-thumb"
        />,
      );

      const root = getColored('colored-thumb');
      const track = (root.children as ElementNode[])[0];
      const thumb = (track.children as ElementNode[])[0];
      const flatThumbStyle = StyleSheet.flatten<ViewStyle>(
        thumb.props.style as StyleProp<ViewStyle>,
      );
      expect(flatThumbStyle.backgroundColor).toBe('#ff0000');
    });

    it('passes custom color tokens into interpolateColor', async () => {
      const onChange = vi.fn();
      await render(
        <Switch
          checked={false}
          onChange={onChange}
          activeColor="#10b981"
          inactiveColor="#6b7280"
          activeBorderColor="#059669"
          inactiveBorderColor="#4b5563"
        />,
      );

      expect(mockInterpolateColor).toHaveBeenCalledWith(
        0,
        [0, 1],
        ['#6b7280', '#10b981'],
      );
      expect(mockInterpolateColor).toHaveBeenCalledWith(
        0,
        [0, 1],
        ['#4b5563', '#059669'],
      );
    });

    it('falls back border colors to background colors when not provided', async () => {
      const onChange = vi.fn();
      await render(
        <Switch
          checked={false}
          onChange={onChange}
          activeColor="#123456"
          inactiveColor="#654321"
        />,
      );

      expect(mockInterpolateColor).toHaveBeenCalledWith(
        0,
        [0, 1],
        ['#654321', '#123456'],
      );
    });
  });

  describe('Interactions', () => {
    it('calls onChange with true when toggled from false', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch checked={false} onChange={onChange} testID="toggle-switch" />,
      );

      await act(async () => {
        await fireEvent.press(getByTestId('toggle-switch'));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('calls onChange with false when toggled from true', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch checked={true} onChange={onChange} testID="toggle-switch" />,
      );

      await act(async () => {
        await fireEvent.press(getByTestId('toggle-switch'));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('calls onChange when pressing labeled row', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          label="Dark Mode"
          testID="dark-mode-row"
        />,
      );

      await act(async () => {
        await fireEvent.press(getByTestId('dark-mode-row'));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('triggers pressIn and pressOut animation handlers', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch checked={false} onChange={onChange} testID="press-anim-switch" />,
      );

      const element = getByTestId('press-anim-switch');

      await act(async () => {
        fireEvent(element, 'pressIn');
      });

      expect(mockWithTiming).toHaveBeenCalledWith(1.15, kinetics.timing.fast);

      await act(async () => {
        fireEvent(element, 'pressOut');
      });

      expect(mockWithSpring).toHaveBeenCalledWith(1, kinetics.spring.stiff);
    });

    it('triggers spring animation on progress when checked changes', async () => {
      const onChange = vi.fn();
      const { rerender } = await render(
        <Switch checked={false} onChange={onChange} testID="spring-switch" />,
      );

      expect(mockWithSpring).toHaveBeenCalledWith(0, kinetics.spring.stiff);

      await act(async () => {
        await rerender(
          <Switch checked={true} onChange={onChange} testID="spring-switch" />,
        );
      });

      expect(mockWithSpring).toHaveBeenCalledWith(1, kinetics.spring.stiff);
    });
  });

  describe('Disabled State', () => {
    it('does not fire onChange when pressed while disabled (standalone)', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          disabled={true}
          testID="disabled-switch"
        />,
      );

      await act(async () => {
        await fireEvent.press(getByTestId('disabled-switch'));
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not fire onChange when pressed while disabled (labeled row)', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          disabled={true}
          label="Disabled Setting"
          testID="disabled-labeled-switch"
        />,
      );

      await act(async () => {
        await fireEvent.press(getByTestId('disabled-labeled-switch'));
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not animate pressIn / pressOut when disabled', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          disabled={true}
          testID="disabled-press-switch"
        />,
      );

      const element = getByTestId('disabled-press-switch');
      mockWithTiming.mockClear();
      mockWithSpring.mockClear();

      await act(async () => {
        fireEvent(element, 'pressIn');
        fireEvent(element, 'pressOut');
      });

      expect(mockWithTiming).not.toHaveBeenCalled();
      expect(mockWithSpring).not.toHaveBeenCalled();
    });

    it('applies disabled opacity style when disabled', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          disabled={true}
          testID="disabled-style-switch"
        />,
      );

      const element = getByTestId('disabled-style-switch');
      const flatStyle = StyleSheet.flatten<ViewStyle>(
        element.props.style as StyleProp<ViewStyle>,
      );
      expect(flatStyle.opacity).toBe(0.45);
    });

    it('applies disabled opacity style in labeled row', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          disabled={true}
          label="Row"
          testID="disabled-row-style"
        />,
      );

      const element = getByTestId('disabled-row-style');
      const flatStyle = StyleSheet.flatten<ViewStyle>(
        element.props.style as StyleProp<ViewStyle>,
      );
      expect(flatStyle.opacity).toBe(0.45);
    });
  });

  describe('Accessibility', () => {
    it('sets accessibilityRole="switch"', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch checked={false} onChange={onChange} testID="role-switch" />,
      );

      expect(getByTestId('role-switch').props.accessibilityRole).toBe('switch');
    });

    it('exposes accessibilityState with checked and disabled states', async () => {
      const onChange = vi.fn();
      const { getByTestId, rerender } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          disabled={false}
          testID="state-switch"
        />,
      );

      let element = getByTestId('state-switch');
      expect(element.props.accessibilityState).toEqual({
        checked: false,
        disabled: false,
      });

      await act(async () => {
        await rerender(
          <Switch
            checked={true}
            onChange={onChange}
            disabled={true}
            testID="state-switch"
          />,
        );
      });

      element = getByTestId('state-switch');
      expect(element.props.accessibilityState).toEqual({
        checked: true,
        disabled: true,
      });
    });

    it('passes custom accessibilityLabel in standalone switch', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          accessibilityLabel="Toggle Wifi"
          testID="a11y-standalone"
        />,
      );

      const element = getByTestId('a11y-standalone');
      expect(element.props.accessibilityLabel).toBe('Toggle Wifi');
    });

    it('defaults accessibilityLabel to label when only label is provided', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          label="Location Services"
          testID="a11y-label-only"
        />,
      );

      const element = getByTestId('a11y-label-only');
      expect(element.props.accessibilityLabel).toBe('Location Services');
    });

    it('combines label and subtitle in accessibilityLabel when both are provided', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          label="Auto-Lock"
          subtitle="Locks screen after 2 minutes"
          testID="a11y-both"
        />,
      );

      const element = getByTestId('a11y-both');
      expect(element.props.accessibilityLabel).toBe(
        'Auto-Lock, Locks screen after 2 minutes',
      );
    });

    it('prefers explicit accessibilityLabel over label/subtitle in labeled mode', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          label="Cellular Data"
          subtitle="Use 5G/LTE network"
          accessibilityLabel="Custom Cellular Description"
          testID="a11y-override"
        />,
      );

      const element = getByTestId('a11y-override');
      expect(element.props.accessibilityLabel).toBe(
        'Custom Cellular Description',
      );
    });

    it('passes accessibilityHint to Pressable in standalone and labeled mode', async () => {
      const onChange = vi.fn();
      const { getByTestId, rerender } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          accessibilityHint="Double tap to toggle"
          testID="hint-switch"
        />,
      );

      expect(getByTestId('hint-switch').props.accessibilityHint).toBe(
        'Double tap to toggle',
      );

      await act(async () => {
        await rerender(
          <Switch
            checked={false}
            onChange={onChange}
            label="With Label"
            accessibilityHint="Double tap to change setting"
            testID="hint-switch"
          />,
        );
      });

      expect(getByTestId('hint-switch').props.accessibilityHint).toBe(
        'Double tap to change setting',
      );
    });

    it('hides the decorative track view from accessibility in labeled mode', async () => {
      const onChange = vi.fn();
      const { getByTestId } = await render(
        <Switch
          checked={false}
          onChange={onChange}
          label="Sound Effects"
          testID="a11y-decorative"
        />,
      );

      const row = getByTestId('a11y-decorative');
      // Children: [View(textContainer), View(decorative switch wrapper)]
      const trackWrapper = (row.children as ElementNode[])[1];
      expect(trackWrapper.props.accessible).toBe(false);
      expect(
        trackWrapper.props['aria-hidden'] ??
          trackWrapper.props.accessibilityElementsHidden,
      ).toBe(true);
      expect(trackWrapper.props.pointerEvents).toBe('none');
    });
  });
});
