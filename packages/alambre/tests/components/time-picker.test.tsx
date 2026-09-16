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

  it('moves the selection up and down the minutes with the arrows', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="08:00" onChange={onChange} testID="tp" />,
    );

    await fireEvent.press(getByTestId('tp-minute-down'));
    expect(onChange).toHaveBeenLastCalledWith('08:01');

    await fireEvent.press(getByTestId('tp-minute-up'));
    await fireEvent.press(getByTestId('tp-minute-up'));
    expect(onChange).toHaveBeenLastCalledWith('08:59');
  });

  it('moves the selection up and down the hours with the arrows', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="08:30" onChange={onChange} testID="tp" />,
    );

    await fireEvent.press(getByTestId('tp-hour-down'));
    expect(onChange).toHaveBeenLastCalledWith('09:30');

    await fireEvent.press(getByTestId('tp-hour-up'));
    await fireEvent.press(getByTestId('tp-hour-up'));
    expect(onChange).toHaveBeenLastCalledWith('07:30');
  });

  it('up arrow wraps minutes backward across zero', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="00:00" onChange={onChange} testID="tp" />,
    );

    await fireEvent.press(getByTestId('tp-minute-up'));
    expect(onChange).toHaveBeenLastCalledWith('00:59');
  });

  it('down arrow wraps minutes forward across 59', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="23:59" onChange={onChange} testID="tp" />,
    );

    await fireEvent.press(getByTestId('tp-minute-down'));
    expect(onChange).toHaveBeenLastCalledWith('23:00');
  });

  it('arrows wrap hours across midnight', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="23:00" onChange={onChange} testID="tp" />,
    );

    await fireEvent.press(getByTestId('tp-hour-down'));
    expect(onChange).toHaveBeenLastCalledWith('00:00');

    await fireEvent.press(getByTestId('tp-hour-up'));
    expect(onChange).toHaveBeenLastCalledWith('23:00');
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
