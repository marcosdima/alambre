import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';
import TimePicker from '../../src/components/time/TimePicker';

describe('TimePicker', () => {
  it('renders the current hour and minute labels', async () => {
    const { getAllByText } = await render(
      <TimePicker value="08:30" onChange={() => undefined} />,
    );

    expect(getAllByText('08')).toBeTruthy();
    expect(getAllByText('30')).toBeTruthy();
  });

  it('increments and decrements minutes with the arrows', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="08:00" onChange={onChange} testID="tp" />,
    );

    await fireEvent.press(getByTestId('tp-minute-inc'));
    expect(onChange).toHaveBeenLastCalledWith('08:01');

    await fireEvent.press(getByTestId('tp-minute-dec'));
    await fireEvent.press(getByTestId('tp-minute-dec'));
    expect(onChange).toHaveBeenLastCalledWith('08:00');
  });

  it('increments and decrements hours with the arrows', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="08:30" onChange={onChange} testID="tp" />,
    );

    await fireEvent.press(getByTestId('tp-hour-inc'));
    expect(onChange).toHaveBeenLastCalledWith('09:30');

    await fireEvent.press(getByTestId('tp-hour-dec'));
    await fireEvent.press(getByTestId('tp-hour-dec'));
    expect(onChange).toHaveBeenLastCalledWith('07:30');
  });

  it('does not step past the value bounds', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="23:59" onChange={onChange} testID="tp" />,
    );

    await fireEvent.press(getByTestId('tp-hour-inc'));
    await fireEvent.press(getByTestId('tp-minute-inc'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selects a value when a visible wheel item is tapped', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="08:30" onChange={onChange} testID="tp" />,
    );

    await fireEvent.press(getByTestId('tp-hour-item-9'));
    expect(onChange).toHaveBeenLastCalledWith('09:30');

    await fireEvent.press(getByTestId('tp-minute-item-31'));
    expect(onChange).toHaveBeenLastCalledWith('09:31');
  });
});
