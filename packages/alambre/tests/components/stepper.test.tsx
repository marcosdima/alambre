import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Stepper } from '../../src/components/base/input/stepper';

describe('Stepper Compound Component', () => {
  it('renders and increments/decrements value', async () => {
    let captured = 5;
    const TestStepper = () => {
      const [val, setVal] = useState(5);
      return (
        <Stepper.Root
          min={0}
          max={10}
          value={val}
          onChange={(v) => {
            captured = v;
            setVal(v);
          }}
          testID="root"
        >
          <Stepper.Decrement accessibilityLabel="Decrement" />
          <Stepper.Value testID="val" />
          <Stepper.Increment accessibilityLabel="Increment" />
        </Stepper.Root>
      );
    };

    const { getByLabelText } = await render(<TestStepper />);

    const inc = getByLabelText('Increment');
    const dec = getByLabelText('Decrement');

    expect(inc).toBeTruthy();
    await act(async () => {
      fireEvent(inc, 'touchEnd');
    });
    expect(captured).toBe(6);

    await act(async () => {
      fireEvent(dec, 'touchEnd');
    });
    expect(captured).toBe(5);
  });
});
