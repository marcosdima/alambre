import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import SegmentedControl from '../../src/components/base/input/select/SegmentedControl';
import { useSelect } from '../../src/components/base/input/select/use-select';

describe('useSelect', () => {
  const options = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
    { value: 'opt3', label: 'Option 3', disabled: true },
  ];

  it('selects option by value', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useSelect({ value: 'opt1', options, onChange }),
    );

    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.isSelected('opt1')).toBe(true);

    await act(async () => {
      result.current.select('opt2');
    });
    expect(onChange).toHaveBeenCalledWith('opt2');
  });

  it('does not select disabled options', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useSelect({ value: 'opt1', options, onChange }),
    );

    await act(async () => {
      result.current.select('opt3');
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selects by index', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useSelect({ value: 'opt1', options, onChange }),
    );

    await act(async () => {
      result.current.selectIndex(1);
    });
    expect(onChange).toHaveBeenCalledWith('opt2');
  });
});

describe('SegmentedControl component', () => {
  it('renders options and responds to press', async () => {
    const onChange = vi.fn();
    const options = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ];

    const { getByTestId } = await render(
      <SegmentedControl
        testID="seg"
        value="a"
        options={options}
        onChange={onChange}
      >
        {({ options: opts, isSelected, select }) => (
          <>
            {opts.map((opt) => (
              <Pressable
                key={opt.value}
                testID={`btn-${opt.value}`}
                onPress={() => select(opt.value)}
              >
                <Text>{`${opt.label} ${isSelected(opt.value) ? '(active)' : ''}`}</Text>
              </Pressable>
            ))}
          </>
        )}
      </SegmentedControl>,
    );

    const control = getByTestId('seg');
    expect(control.props.accessibilityRole).toBe('radiogroup');

    await act(async () => {
      await fireEvent.press(getByTestId('btn-b'));
    });
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
