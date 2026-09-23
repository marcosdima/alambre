import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import Stepper from '../../src/components/base/input/stepper/Stepper';
import { useStepper } from '../../src/components/base/input/stepper/use-stepper';

describe('useStepper', () => {
  it('increments and decrements within bounds', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useStepper({ value: 5, min: 0, max: 10, step: 1, onChange }),
    );

    expect(result.current.canIncrement).toBe(true);
    expect(result.current.canDecrement).toBe(true);

    await act(async () => {
      result.current.increment();
    });
    expect(onChange).toHaveBeenCalledWith(6);

    await act(async () => {
      result.current.decrement();
    });
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('respects min and max bounds', async () => {
    const onChange = vi.fn();
    const { result: maxResult } = await renderHook(() =>
      useStepper({ value: 10, min: 0, max: 10, step: 1, onChange }),
    );

    expect(maxResult.current.canIncrement).toBe(false);
    expect(maxResult.current.canDecrement).toBe(true);

    await act(async () => {
      maxResult.current.increment();
    });
    expect(onChange).not.toHaveBeenCalled();

    const { result: minResult } = await renderHook(() =>
      useStepper({ value: 0, min: 0, max: 10, step: 1, onChange }),
    );

    expect(minResult.current.canIncrement).toBe(true);
    expect(minResult.current.canDecrement).toBe(false);

    await act(async () => {
      minResult.current.decrement();
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles floating point precision properly', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useStepper({ value: 0.1, step: 0.2, onChange }),
    );

    await act(async () => {
      result.current.increment();
    });
    expect(onChange).toHaveBeenCalledWith(0.3);
  });

  it('prevents changes when disabled', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useStepper({ value: 5, step: 1, disabled: true, onChange }),
    );

    expect(result.current.canIncrement).toBe(false);
    expect(result.current.canDecrement).toBe(false);

    await act(async () => {
      result.current.increment();
    });
    await act(async () => {
      result.current.decrement();
    });
    await act(async () => {
      result.current.setValue(8);
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Stepper component', () => {
  it('renders children with render prop and accessibility attributes', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <Stepper testID="stepper" value={3} min={0} max={10} onChange={onChange}>
        {({ value, increment, decrement, canIncrement, canDecrement }) => (
          <>
            <Pressable testID="dec" onPress={decrement} disabled={!canDecrement}>
              <Text>-</Text>
            </Pressable>
            <Text testID="val">{value}</Text>
            <Pressable testID="inc" onPress={increment} disabled={!canIncrement}>
              <Text>+</Text>
            </Pressable>
          </>
        )}
      </Stepper>,
    );

    const container = getByTestId('stepper');
    expect(container.props.accessibilityRole).toBe('spinbutton');
    expect(container.props.accessibilityValue).toEqual({ min: 0, max: 10, now: 3 });

    expect(getByTestId('val').props.children).toBe(3);

    await act(async () => {
      await fireEvent.press(getByTestId('inc'));
    });
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
