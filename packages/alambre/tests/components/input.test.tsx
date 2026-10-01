import { act, fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';
import Input from '../../src/components/base/input/text/Input';

describe('Input', () => {
  it('renders and forwards change text event', async () => {
    const onChangeText = vi.fn();
    const { getByTestId } = await render(
      <Input testID="txt-input" value="hello" onChangeText={onChangeText} />,
    );

    const input = getByTestId('txt-input');
    expect(input.props.value).toBe('hello');

    await act(async () => {
      await fireEvent.changeText(input, 'world');
    });

    expect(onChangeText).toHaveBeenCalledWith('world');
  });

  it('handles focus and blur states via style callback', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const { getByTestId } = await render(
      <Input
        testID="txt-input"
        onFocus={onFocus}
        onBlur={onBlur}
        style={({ focused }) => ({
          borderColor: focused ? 'blue' : 'gray',
        })}
      />,
    );

    const input = getByTestId('txt-input');

    await act(async () => {
      await fireEvent(input, 'focus');
    });
    expect(onFocus).toHaveBeenCalled();
    expect(input.props.style).toEqual({ borderColor: 'blue' });

    await act(async () => {
      await fireEvent(input, 'blur');
    });
    expect(onBlur).toHaveBeenCalled();
    expect(input.props.style).toEqual({ borderColor: 'gray' });
  });

  it('marks input as disabled and not editable when disabled', async () => {
    const { getByTestId } = await render(
      <Input testID="txt-input" disabled value="test" />,
    );

    const input = getByTestId('txt-input');
    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState.disabled).toBe(true);
  });

  it('marks input as invalid when error is provided', async () => {
    const { getByTestId } = await render(
      <Input testID="txt-input" error="Field required" />,
    );

    const input = getByTestId('txt-input');
    expect(input.props['aria-invalid']).toBe(true);
  });
});
