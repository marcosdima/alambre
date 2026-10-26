import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import AppButton from '../../src/ui/components/AppButton';

describe('AppButton component', () => {
  describe('label and children rendering', () => {
    it('renders label prop inside a Text component', async () => {
      const { getByText, toJSON } = await render(<AppButton label="Click Me" />);

      expect(getByText('Click Me')).toBeDefined();
      const tree = toJSON() as any;
      const animatedView = tree.children[0];
      const textChild = animatedView.children[0];
      expect(textChild.type).toMatch(/Text$/);
      expect(textChild.children).toEqual(['Click Me']);
    });

    it('renders single string child inside a Text component', async () => {
      const { getByText, toJSON } = await render(<AppButton>Submit</AppButton>);

      expect(getByText('Submit')).toBeDefined();
      const tree = toJSON() as any;
      const animatedView = tree.children[0];
      const textChild = animatedView.children[0];
      expect(textChild.type).toMatch(/Text$/);
      expect(textChild.children).toEqual(['Submit']);
    });

    it('renders single numeric child inside a Text component', async () => {
      const { getByText, toJSON } = await render(<AppButton>{42}</AppButton>);

      expect(getByText('42')).toBeDefined();
      const tree = toJSON() as any;
      const textChild = tree.children[0].children[0];
      expect(textChild.type).toMatch(/Text$/);
      expect(textChild.children).toEqual(['42']);
    });

    it('renders numeric zero child inside a Text component', async () => {
      const { getByText, toJSON } = await render(<AppButton>{0}</AppButton>);

      expect(getByText('0')).toBeDefined();
      const tree = toJSON() as any;
      const textChild = tree.children[0].children[0];
      expect(textChild.type).toMatch(/Text$/);
      expect(textChild.children).toEqual(['0']);
    });

    it('renders compound text children inside a Text component without raw string primitives in View', async () => {
      const { getByText, toJSON } = await render(
        <AppButton>Toggle Flip ({'Back'})</AppButton>,
      );

      expect(getByText('Toggle Flip (Back)')).toBeDefined();
      const tree = toJSON() as any;
      const textChild = tree.children[0].children[0];
      expect(textChild.type).toMatch(/Text$/);
      expect(textChild.children).toEqual(['Toggle Flip (', 'Back', ')']);
    });

    it('renders compound numeric children inside a Text component', async () => {
      const { getByText, toJSON } = await render(
        <AppButton>Play {1}</AppButton>,
      );

      expect(getByText('Play 1')).toBeDefined();
      const tree = toJSON() as any;
      const textChild = tree.children[0].children[0];
      expect(textChild.type).toMatch(/Text$/);
      expect(textChild.children).toEqual(['Play ', '1']);
    });

    it('renders custom ReactNode children directly without extra Text wrapper', async () => {
      const { getByTestId, toJSON } = await render(
        <AppButton>
          <View testID="custom-child" />
        </AppButton>,
      );

      expect(getByTestId('custom-child')).toBeDefined();
      const tree = toJSON() as any;
      const animatedView = tree.children[0];
      expect(animatedView.children[0].props.testID).toBe('custom-child');
      expect(animatedView.children[0].type).toMatch(/View$/);
    });

    it('supports render prop children function', async () => {
      const { getByTestId } = await render(
        <AppButton>
          {({ pressed, disabled, loading }) => (
            <View testID="render-prop-view" />
          )}
        </AppButton>,
      );

      expect(getByTestId('render-prop-view')).toBeDefined();
    });
  });

  describe('icons and layout', () => {
    it('renders leftIcon and rightIcon slots', async () => {
      const { getByTestId, getByText, toJSON } = await render(
        <AppButton
          leftIcon={<View testID="left-icon" />}
          rightIcon={<View testID="right-icon" />}
          label="Action"
        />,
      );

      expect(getByTestId('left-icon')).toBeDefined();
      expect(getByText('Action')).toBeDefined();
      expect(getByTestId('right-icon')).toBeDefined();

      const tree = toJSON() as any;
      const animatedView = tree.children[0];
      expect(animatedView.children).toHaveLength(3);
      expect(animatedView.children[0].props.testID).toBe('left-icon');
      expect(animatedView.children[1].type).toMatch(/Text$/);
      expect(animatedView.children[2].props.testID).toBe('right-icon');
    });

    it('renders ActivityIndicator when loading is true', async () => {
      const { queryByText, toJSON } = await render(
        <AppButton loading label="Saving" />,
      );

      expect(queryByText('Saving')).toBeNull();
      const tree = toJSON() as any;
      expect(tree.props.accessibilityState.busy).toBe(true);
      const animatedView = tree.children[0];
      expect(animatedView.children).toHaveLength(1);
      expect(animatedView.children[0].children[0].type).toBe('RCTActivityIndicatorView');
    });
  });

  describe('interactions and styles', () => {
    it('fires onPress callback when clicked and enabled', async () => {
      const onPress = vi.fn();
      const { getByRole } = await render(
        <AppButton label="Press Me" onPress={onPress} />,
      );

      await act(async () => {
        await fireEvent.press(getByRole('button'));
      });

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not fire onPress when disabled', async () => {
      const onPress = vi.fn();
      const { getByRole } = await render(
        <AppButton disabled label="Press Me" onPress={onPress} />,
      );

      await act(async () => {
        await fireEvent.press(getByRole('button'));
      });

      expect(onPress).not.toHaveBeenCalled();
    });

    it('does not fire onPress when loading', async () => {
      const onPress = vi.fn();
      const { getByRole } = await render(
        <AppButton loading label="Press Me" onPress={onPress} />,
      );

      await act(async () => {
        await fireEvent.press(getByRole('button'));
      });

      expect(onPress).not.toHaveBeenCalled();
    });

    it('applies variant and tone styling', async () => {
      const { toJSON } = await render(
        <AppButton variant="solid" tone="danger" label="Delete" />,
      );

      const tree = toJSON() as any;
      const shellStyle = StyleSheet.flatten(tree.children[0].props.style);
      expect(shellStyle.backgroundColor).toBe('#c16757');
      const textStyle = StyleSheet.flatten(tree.children[0].children[0].props.style);
      expect(textStyle.color).toBe('#ffffff');
    });
  });
});
