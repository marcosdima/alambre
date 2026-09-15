import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';
import TimePicker from '../../src/components/time/TimePicker';

const PAD = 68;

describe('TimePicker', () => {
  it('renders the current hour and minute labels', async () => {
    const { getAllByText } = await render(
      <TimePicker value="08:30" onChange={() => undefined} />,
    );

    expect(getAllByText('08')).toBeTruthy();
    expect(getAllByText('30')).toBeTruthy();
  });

  it('emits a new value when the minute wheel settles', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="08:00" onChange={onChange} testID="tp" />,
    );

    await fireEvent(getByTestId('tp-minute-scroll'), 'momentumScrollEnd', {
      nativeEvent: {
        contentOffset: { y: PAD + 20 * 34, x: 0 },
        contentSize: { height: 60 * 34, width: 100 },
        layoutMeasurement: { height: 5 * 34, width: 100 },
      },
    });

    expect(onChange).toHaveBeenCalledWith('08:20');
  });

  it('emits a new value when the hour wheel settles', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="08:30" onChange={onChange} testID="tp" />,
    );

    await fireEvent(getByTestId('tp-hour-scroll'), 'momentumScrollEnd', {
      nativeEvent: {
        contentOffset: { y: PAD + 17 * 34, x: 0 },
        contentSize: { height: 24 * 34, width: 100 },
        layoutMeasurement: { height: 5 * 34, width: 100 },
      },
    });

    expect(onChange).toHaveBeenCalledWith('17:30');
  });

  it('selects a value when a wheel item is tapped', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <TimePicker value="08:30" onChange={onChange} testID="tp" />,
    );

    await fireEvent.press(getByTestId('tp-hour-item-17'));
    expect(onChange).toHaveBeenCalledWith('17:30');

    await fireEvent.press(getByTestId('tp-minute-item-5'));
    expect(onChange).toHaveBeenCalledWith('17:05');
  });
});
