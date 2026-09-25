import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { LightDarkProvider } from '../src/providers/theme';
import AnimatedCascade from '../src/components/AnimatedCascade';

const renderWithTheme = async (ui: ReactElement) => {
  return await render(<LightDarkProvider>{ui}</LightDarkProvider>);
};

describe('AnimatedCascade component contract', () => {
  it('renders all child elements properly', async () => {
    const screen = await renderWithTheme(
      <AnimatedCascade pattern="top-to-bottom" staggerMs={40}>
        <Text testID="item-1">Card Alpha</Text>
        <Text testID="item-2">Card Beta</Text>
        <Text testID="item-3">Card Gamma</Text>
      </AnimatedCascade>,
    );

    expect(screen.getByTestId('item-1')).toBeDefined();
    expect(screen.getByTestId('item-2')).toBeDefined();
    expect(screen.getByTestId('item-3')).toBeDefined();
  });

  it('handles empty children gracefully', async () => {
    const screen = await renderWithTheme(
      <AnimatedCascade>
        {null}
        {undefined}
      </AnimatedCascade>,
    );

    expect(screen.toJSON()).toBeDefined();
  });

  it('renders alternating pattern children correctly', async () => {
    const screen = await renderWithTheme(
      <AnimatedCascade pattern="alternate" staggerMs={30}>
        <Text>Item Left</Text>
        <Text>Item Right</Text>
      </AnimatedCascade>,
    );

    expect(screen.getByText('Item Left')).toBeDefined();
    expect(screen.getByText('Item Right')).toBeDefined();
  });
});
