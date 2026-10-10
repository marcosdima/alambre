import { act, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimatedCounter } from '../../src/components/base/display/animated-counter/AnimatedCounter';
import { kinetics } from '../../src/core/kinetics';

// Mock Reanimated
const mockWithTiming = vi.fn((toValue: unknown, _config?: unknown) => toValue);
const mockWithSpring = vi.fn((toValue: unknown, _config?: unknown) => toValue);
const mockWithSequence = vi.fn((...args: unknown[]) => args[args.length - 1]);

vi.mock('react-native-reanimated', async () => {
  const ReactActual = await import('react');
  const { View: RNView, Text: RNText } = await import('react-native');

  return {
    default: {
      View: ({
        children,
        style,
        ...props
      }: {
        children?: ReactNode;
        style?: StyleProp<ViewStyle>;
      }) => ReactActual.createElement(RNView, { style, ...props }, children),
      Text: ({
        children,
        style,
        ...props
      }: {
        children?: ReactNode;
        style?: StyleProp<TextStyle>;
      }) => ReactActual.createElement(RNText, { style, ...props }, children),
    },
    useSharedValue: vi.fn((val: unknown) => {
      const ref = ReactActual.useRef({ value: val });
      return ref.current;
    }),
    useAnimatedStyle: vi.fn((cb: () => unknown) => cb()),
    withSpring: (...args: [unknown, unknown?]) => mockWithSpring(...args),
    withTiming: (...args: [unknown, unknown?]) => mockWithTiming(...args),
    withSequence: (...args: unknown[]) => mockWithSequence(...args),
  };
});

describe('AnimatedCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering & Default Props', () => {
    it('renders the provided numeric value with default color and fontSize', async () => {
      const { getByText, queryByText } = await render(<AnimatedCounter value={42} />);

      const valueText = getByText('42');
      expect(valueText).toBeTruthy();

      const flatStyle = StyleSheet.flatten<TextStyle>(valueText.props.style);
      expect(flatStyle.color).toBe('#000');
      expect(flatStyle.fontSize).toBe(20);
      expect(flatStyle.letterSpacing).toBe(-0.5);
      expect(flatStyle.includeFontPadding).toBe(false);

      // Suffix should not be rendered when not provided
      expect(queryByText('%')).toBeNull();
    });

    it('renders zero value properly without disappearing', async () => {
      const { getByText } = await render(<AnimatedCounter value={0} />);
      expect(getByText('0')).toBeTruthy();
    });

    it('renders negative values properly', async () => {
      const { getByText } = await render(<AnimatedCounter value={-15} />);
      expect(getByText('-15')).toBeTruthy();
    });
  });

  describe('Leading Zeroes Padding (padLeadingZeroes)', () => {
    it('does not pad single digits when padLeadingZeroes is false by default', async () => {
      const { getByText, queryByText } = await render(<AnimatedCounter value={7} />);
      expect(getByText('7')).toBeTruthy();
      expect(queryByText('07')).toBeNull();
    });

    it('pads single digit numbers with a leading zero when padLeadingZeroes is true', async () => {
      const { getByText, queryByText } = await render(
        <AnimatedCounter value={7} padLeadingZeroes={true} />,
      );
      expect(getByText('07')).toBeTruthy();
      expect(queryByText('7')).toBeNull();
    });

    it('pads zero to "00" when padLeadingZeroes is true', async () => {
      const { getByText } = await render(
        <AnimatedCounter value={0} padLeadingZeroes={true} />,
      );
      expect(getByText('00')).toBeTruthy();
    });

    it('does not add extra leading zeroes to numbers with 2 or more digits', async () => {
      const { getByText, rerender } = await render(
        <AnimatedCounter value={42} padLeadingZeroes={true} />,
      );
      expect(getByText('42')).toBeTruthy();

      await act(async () => {
        await rerender(<AnimatedCounter value={100} padLeadingZeroes={true} />);
      });
      expect(getByText('100')).toBeTruthy();
    });
  });

  describe('Suffix Rendering and Styling', () => {
    it('renders suffix text with scaled font size (75% of base fontSize) and default styling', async () => {
      const { getByText } = await render(<AnimatedCounter value={99} suffix="%" />);

      expect(getByText('99')).toBeTruthy();
      const suffixText = getByText('%');
      expect(suffixText).toBeTruthy();

      const flatSuffixStyle = StyleSheet.flatten<TextStyle>(suffixText.props.style);
      expect(flatSuffixStyle.color).toBe('#000');
      expect(flatSuffixStyle.fontSize).toBe(15); // 20 * 0.75
      expect(flatSuffixStyle.opacity).toBe(0.85);
      expect(flatSuffixStyle.includeFontPadding).toBe(false);
    });

    it('does not render suffix element when suffix is undefined or empty string', async () => {
      const { queryByText, rerender } = await render(<AnimatedCounter value={10} />);
      expect(queryByText('%')).toBeNull();

      await act(async () => {
        await rerender(<AnimatedCounter value={10} suffix="" />);
      });
      expect(queryByText('%')).toBeNull();
    });
  });

  describe('Custom Color, FontSize, and TextStyle Props', () => {
    it('applies custom color and custom fontSize to both value and suffix texts', async () => {
      const { getByText } = await render(
        <AnimatedCounter
          value={50}
          suffix="k"
          color="#3b82f6"
          fontSize={32}
        />,
      );

      const valueText = getByText('50');
      const suffixText = getByText('k');

      const flatValueStyle = StyleSheet.flatten<TextStyle>(valueText.props.style);
      expect(flatValueStyle.color).toBe('#3b82f6');
      expect(flatValueStyle.fontSize).toBe(32);

      const flatSuffixStyle = StyleSheet.flatten<TextStyle>(suffixText.props.style);
      expect(flatSuffixStyle.color).toBe('#3b82f6');
      expect(flatSuffixStyle.fontSize).toBe(24); // 32 * 0.75
    });

    it('applies custom textStyle prop to both value and suffix texts', async () => {
      const customTextStyle = {
        fontWeight: '700' as const,
        letterSpacing: 2,
      };

      const { getByText } = await render(
        <AnimatedCounter
          value={88}
          suffix="pts"
          textStyle={customTextStyle}
        />,
      );

      const valueText = getByText('88');
      const suffixText = getByText('pts');

      const flatValueStyle = StyleSheet.flatten<TextStyle>(valueText.props.style);
      expect(flatValueStyle.fontWeight).toBe('700');
      expect(flatValueStyle.letterSpacing).toBe(2);

      const flatSuffixStyle = StyleSheet.flatten<TextStyle>(suffixText.props.style);
      expect(flatSuffixStyle.fontWeight).toBe('700');
      expect(flatSuffixStyle.letterSpacing).toBe(2);
    });
  });

  describe('Animation Triggers & Kinetics Behavior', () => {
    it('triggers spring bounce sequence on initial mount with kinetics config', async () => {
      await render(<AnimatedCounter value={10} />);

      // Verify withTiming calls for scale and translateY
      expect(mockWithTiming).toHaveBeenCalledWith(1.22, kinetics.timing.fast);
      expect(mockWithTiming).toHaveBeenCalledWith(-3, kinetics.timing.fast);

      // Verify withSpring calls for scale and translateY
      expect(mockWithSpring).toHaveBeenCalledWith(1, kinetics.spring.stiff);
      expect(mockWithSpring).toHaveBeenCalledWith(0, kinetics.spring.stiff);

      // Verify withSequence was called twice (for scale and translateY)
      expect(mockWithSequence).toHaveBeenCalledTimes(2);
    });

    it('re-triggers animation sequence when value prop changes', async () => {
      const { rerender } = await render(<AnimatedCounter value={10} />);

      expect(mockWithSequence).toHaveBeenCalledTimes(2);
      vi.clearAllMocks();

      // Update value
      await act(async () => {
        await rerender(<AnimatedCounter value={20} />);
      });

      expect(mockWithTiming).toHaveBeenCalledWith(1.22, kinetics.timing.fast);
      expect(mockWithTiming).toHaveBeenCalledWith(-3, kinetics.timing.fast);
      expect(mockWithSpring).toHaveBeenCalledWith(1, kinetics.spring.stiff);
      expect(mockWithSpring).toHaveBeenCalledWith(0, kinetics.spring.stiff);
      expect(mockWithSequence).toHaveBeenCalledTimes(2);
    });

    it('does not re-trigger animation sequence when value does not change', async () => {
      const { rerender } = await render(<AnimatedCounter value={10} color="#000" />);

      expect(mockWithSequence).toHaveBeenCalledTimes(2);
      vi.clearAllMocks();

      // Update a different prop without changing value
      await act(async () => {
        await rerender(<AnimatedCounter value={10} color="#fff" />);
      });

      expect(mockWithSequence).not.toHaveBeenCalled();
    });
  });

  describe('Component Layout & Structure', () => {
    it('applies expected container and numberBox styles and transforms', async () => {
      const { toJSON, getByText } = await render(<AnimatedCounter value={42} />);
      const tree = toJSON() as {
        props: { style?: StyleProp<ViewStyle> };
        children?: Array<{ props: { style?: StyleProp<ViewStyle> } }>;
      };

      const flatContainerStyle = StyleSheet.flatten<ViewStyle>(tree.props.style);
      console.log('TREE IS:', JSON.stringify(tree, null, 2));
      expect(flatContainerStyle.flexDirection).toBe('row');
      expect(flatContainerStyle.alignItems).toBe('baseline');
      expect(flatContainerStyle.justifyContent).toBe('center');
      expect(flatContainerStyle.gap).toBe(5);
      expect(flatContainerStyle.top).toBe(-2);

      const numberBoxNode = tree.children?.[0];
      const flatNumberBoxStyle = StyleSheet.flatten<ViewStyle>(
        numberBoxNode?.props.style,
      );
      expect(flatNumberBoxStyle.alignItems).toBe('center');
      expect(flatNumberBoxStyle.justifyContent).toBe('center');
      expect(flatNumberBoxStyle.transform).toEqual([
        { scale: 1 },
        { translateY: 0 },
      ]);

      expect(getByText('42')).toBeTruthy();
    });
  });
});
