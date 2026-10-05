import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react-native';
import { Input } from '../../src/components/base/input/text';

describe('Input Compound Component', () => {
  it('renders correctly and manages focus state', async () => {
    const { getByTestId } = await render(
      <Input.Root testID="root">
        <Input.Field testID="field" placeholder="Enter text" />
      </Input.Root>,
    );

    const root = getByTestId('root');
    const field = getByTestId('field');

    expect(root).toBeTruthy();
    expect(field).toBeTruthy();
  });

  it('renders with error state and feedback', async () => {
    const { getByTestId, getByText } = await render(
      <Input.Root testID="root" error={true}>
        <Input.Field testID="field" />
        <Input.Feedback>Error message</Input.Feedback>
      </Input.Root>,
    );

    const root = getByTestId('root');
    expect(root).toBeTruthy();
    const feedback = getByText('Error message');
    expect(feedback).toBeTruthy();
  });

  it('renders disabled state correctly', async () => {
    const { getByTestId } = await render(
      <Input.Root testID="root" disabled={true}>
        <Input.Field testID="field" />
      </Input.Root>,
    );

    const field = getByTestId('field');
    expect(field.props.editable).toBe(false);
  });
});
