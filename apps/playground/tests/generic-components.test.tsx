import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { LightDarkProvider } from '../src/providers/theme';
import AppAccordion from '../src/components/AppAccordion';
import AppProgressBar from '../src/components/AppProgressBar';
import AppTextInput from '../src/components/AppTextInput';

const renderWithTheme = async (ui: ReactElement) => {
  return await render(<LightDarkProvider>{ui}</LightDarkProvider>);
};

describe('AppAccordion component contract', () => {
  it('renders title, badge, and accessible button semantics', async () => {
    const screen = await renderWithTheme(
      <AppAccordion title="Account Security" badge="Pro">
        <Text>Content inside accordion</Text>
      </AppAccordion>,
    );

    const button = screen.getByLabelText('Account Security');
    expect(button).toBeDefined();
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityState.expanded).toBe(false);
    expect(screen.getByText('Pro')).toBeDefined();
  });

  it('toggles expansion state and invokes onToggle', async () => {
    const onToggle = vi.fn();
    const screen = await renderWithTheme(
      <AppAccordion title="Toggle Test" onToggle={onToggle}>
        <Text>Inner Details</Text>
      </AppAccordion>,
    );

    const button = screen.getByLabelText('Toggle Test');
    fireEvent.press(button);

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('supports spring animationType, custom springConfig and rotationAngle', async () => {
    const screen = await renderWithTheme(
      <AppAccordion
        title="Spring Config Test"
        animationType="spring"
        springConfig={{ damping: 20, stiffness: 150 }}
        rotationAngle={90}
        defaultExpanded={true}
      >
        <Text>Spring Details</Text>
      </AppAccordion>,
    );

    const button = screen.getByLabelText('Spring Config Test');
    expect(button.props.accessibilityState.expanded).toBe(true);
  });
});

describe('AppProgressBar component contract', () => {
  it('renders with accessibilityRole="progressbar" and percentage', async () => {
    const screen = await renderWithTheme(
      <AppProgressBar
        value={75}
        max={100}
        label="Download progress"
        showPercentage
      />,
    );

    const bar = screen.getByLabelText('Download progress');
    expect(bar).toBeDefined();
    expect(bar.props.accessibilityRole).toBe('progressbar');
    expect(bar.props.accessibilityValue.now).toBe(75);
    expect(screen.getByText('75%')).toBeDefined();
  });

  it('renders indeterminate state without definite now value', async () => {
    const screen = await renderWithTheme(
      <AppProgressBar
        value={0}
        label="Buffering..."
        indeterminate
      />,
    );

    const bar = screen.getByLabelText('Buffering...');
    expect(bar.props.accessibilityValue).toBeUndefined();
  });
});

describe('AppTextInput component contract', () => {
  it('renders with label and handles clearable action', async () => {
    const onChangeText = vi.fn();
    const screen = await renderWithTheme(
      <AppTextInput
        label="Username"
        defaultValue="Initial User"
        clearable
        onChangeText={onChangeText}
      />,
    );

    const clearBtn = screen.getByLabelText('Clear text');
    expect(clearBtn).toBeDefined();
    fireEvent.press(clearBtn);
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('renders password toggle and toggles visibility state', async () => {
    const screen = await renderWithTheme(
      <AppTextInput
        label="Master Key"
        defaultValue="SecretPhrase"
        isPassword
      />,
    );

    const toggleBtn = screen.getByLabelText('Show password');
    expect(toggleBtn).toBeDefined();
    fireEvent.press(toggleBtn);
    expect(await screen.findByLabelText('Hide password')).toBeDefined();
  });
});
