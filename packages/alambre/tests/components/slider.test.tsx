import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { Text } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import Slider from '../../src/components/base/input/slider/Slider';
import { useSlider } from '../../src/components/base/input/slider/use-slider';

describe('useSlider', () => {
  it('computes correct ratio and percentage', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useSlider({ value: 50, min: 0, max: 100, onChange }),
    );

    expect(result.current.ratio).toBe(0.5);
    expect(result.current.percentage).toBe(50);
  });

  it('updates value from ratio respecting step and bounds', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useSlider({ value: 0, min: 0, max: 200, step: 25, onChange }),
    );

    await act(async () => {
      result.current.setValueFromRatio(0.48); // 0.48 * 200 = 96 -> snapped to 100
    });
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('increments and decrements correctly', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useSlider({ value: 10, min: 0, max: 50, step: 5, onChange }),
    );

    await act(async () => {
      result.current.increment();
    });
    expect(onChange).toHaveBeenCalledWith(15);

    await act(async () => {
      result.current.decrement();
    });
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('prevents updates when disabled', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useSlider({ value: 20, min: 0, max: 100, disabled: true, onChange }),
    );

    await act(async () => {
      result.current.setValueFromRatio(0.8);
      result.current.increment();
      result.current.decrement();
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Slider component', () => {
  it('renders with accessibility properties', async () => {
    const onChange = vi.fn();
    const { getByTestId } = await render(
      <Slider
        testID="slider"
        value={40}
        min={0}
        max={100}
        step={10}
        onChange={onChange}
      >
        {({ value, percentage }) => (
          <Text testID="val-display">{`${value} (${percentage}%)`}</Text>
        )}
      </Slider>,
    );

    const slider = getByTestId('slider');
    expect(slider.props.accessibilityRole).toBe('adjustable');
    expect(slider.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 40 });

    await act(async () => {
      await fireEvent(slider, 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      });
    });
    expect(onChange).toHaveBeenCalledWith(50);
  });
});
