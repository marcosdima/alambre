import { act, fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import type { ButtonState } from '../src/components/base/input/buttons/Button';
import Button from '../src/components/base/input/buttons/Button';

describe('Button', () => {
  it('renders children as a plain node', async () => {
    const { getByText } = await render(
      <Button>
        <Text>Go</Text>
      </Button>,
    );

    expect(getByText('Go')).toBeTruthy();
  });

  it('fires onPress when enabled', async () => {
    const onPress = vi.fn();
    const { getByTestId } = await render(
      <Button testID="btn" onPress={onPress}>
        <Text>Go</Text>
      </Button>,
    );

    await act(async () => {
      await fireEvent.press(getByTestId('btn'));
    });

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress while loading', async () => {
    const onPress = vi.fn();
    const { getByTestId } = await render(
      <Button testID="btn" loading onPress={onPress}>
        <Text>Go</Text>
      </Button>,
    );

    await act(async () => {
      await fireEvent.press(getByTestId('btn'));
    });

    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress while disabled', async () => {
    const onPress = vi.fn();
    const { getByTestId } = await render(
      <Button testID="btn" disabled onPress={onPress}>
        <Text>Go</Text>
      </Button>,
    );

    await act(async () => {
      await fireEvent.press(getByTestId('btn'));
    });

    expect(onPress).not.toHaveBeenCalled();
  });

  it('defaults to the button accessibility role', async () => {
    const { getByTestId } = await render(
      <Button testID="btn">
        <Text>Go</Text>
      </Button>,
    );

    const element = getByTestId('btn');
    expect(element.props.role).toBe('button');
  });

  it('exposes loading as busy and disabled in accessibility state', async () => {
    const { getByTestId } = await render(
      <Button testID="btn" loading>
        <Text>Go</Text>
      </Button>,
    );

    const element = getByTestId('btn');
    expect(element.props.accessibilityState.disabled).toBe(true);
    expect(element.props.accessibilityState.busy).toBe(true);
  });

  it('exposes disabled in accessibility state', async () => {
    const { getByTestId } = await render(
      <Button testID="btn" disabled>
        <Text>Go</Text>
      </Button>,
    );

    const element = getByTestId('btn');
    expect(element.props.accessibilityState.disabled).toBe(true);
    expect(element.props.accessibilityState.busy).toBe(false);
  });

  it('keeps the accessibility state consistent when enabled', async () => {
    const { getByTestId } = await render(
      <Button testID="btn">
        <Text>Go</Text>
      </Button>,
    );

    const element = getByTestId('btn');
    expect(element.props.accessibilityState.disabled).toBe(false);
    expect(element.props.accessibilityState.busy).toBe(false);
  });

  it('merges a custom accessibilityState', async () => {
    const { getByTestId } = await render(
      <Button testID="btn" accessibilityState={{ selected: true }}>
        <Text>Go</Text>
      </Button>,
    );

    const element = getByTestId('btn');
    expect(element.props.accessibilityState.disabled).toBe(false);
    expect(element.props.accessibilityState.busy).toBe(false);
    expect(element.props.accessibilityState.selected).toBe(true);
  });

  it('passes the interaction state to children render prop', async () => {
    const captured: ButtonState[] = [];

    const { getByText } = await render(
      <Button loading disabled>
        {({ pressed, disabled, loading }) => {
          captured.push({ pressed, disabled, loading });
          return <Text>Go</Text>;
        }}
      </Button>,
    );

    expect(getByText('Go')).toBeTruthy();
    expect(captured).toEqual([
      { pressed: false, disabled: true, loading: true },
    ]);
  });

  it('passes the interaction state to the style callback', async () => {
    const captured: ButtonState[] = [];

    const { getByTestId } = await render(
      <Button
        testID="btn"
        loading
        disabled
        style={({ pressed, disabled, loading }) => {
          captured.push({ pressed, disabled, loading });
          return undefined;
        }}
      >
        <Text>Go</Text>
      </Button>,
    );

    const element = getByTestId('btn');
    expect(element).toBeTruthy();
    expect(captured).toEqual([
      { pressed: false, disabled: true, loading: true },
    ]);
  });
});
