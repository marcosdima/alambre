import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react-native';
import { Slider } from '../../src/components/base/input/slider';

describe('Slider Compound Component', () => {
  it('renders correctly', async () => {
    const { getByTestId } = await render(
      <Slider.Root testID="root" value={50}>
        <Slider.Track testID="track">
          <Slider.Range testID="range" />
          <Slider.Thumb testID="thumb" />
        </Slider.Track>
      </Slider.Root>,
    );

    expect(getByTestId('root')).toBeTruthy();
    expect(getByTestId('track')).toBeTruthy();
    expect(getByTestId('range')).toBeTruthy();
    expect(getByTestId('thumb')).toBeTruthy();
  });
});
