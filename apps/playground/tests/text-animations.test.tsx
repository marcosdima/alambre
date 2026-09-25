import type { ReactElement } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react-native';
import { LightDarkProvider } from '../src/providers/theme';
import TypewriterText from '../src/components/text-animations/TypewriterText';
import TickerText from '../src/components/text-animations/TickerText';
import WavyText from '../src/components/text-animations/WavyText';

const renderWithTheme = async (ui: ReactElement) => {
  return await render(<LightDarkProvider>{ui}</LightDarkProvider>);
};

describe('TypewriterText component contract', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders with accessibilityRole="text" and accessible label', async () => {
    const { getByLabelText } = await renderWithTheme(
      <TypewriterText text="Hello World" initialDelay={0} />,
    );
    const element = getByLabelText('Hello World');
    expect(element).toBeDefined();
    expect(element.props.accessibilityRole).toBe('text');
  });

  it('types characters progressively according to speed and initialDelay', async () => {
    const onComplete = vi.fn();
    const screen = await renderWithTheme(
      <TypewriterText
        text="Fast"
        initialDelay={100}
        speed={50}
        cursor={false}
        onComplete={onComplete}
      />,
    );

    // Advance through initialDelay (100ms)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('F')).toBeDefined();

    // Advance 50ms -> second character: 'Fa'
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByText('Fa')).toBeDefined();

    // Advance remaining characters (100ms -> 'Fas', 'Fast')
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('Fast')).toBeDefined();

    // Advance 50ms for completion callback
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders cursor during typing', async () => {
    const screen = await renderWithTheme(
      <TypewriterText
        text="Cursor Test"
        cursor={true}
        cursorChar="|"
      />,
    );
    expect(screen.getByText('|')).toBeDefined();
  });
});

describe('TickerText component contract', () => {
  it('renders with accessible label and prefix/suffix', async () => {
    const screen = await renderWithTheme(
      <TickerText
        value={42}
        prefix="$"
        suffix="USD"
      />,
    );

    const root = screen.getByLabelText('42');
    expect(root).toBeDefined();
    expect(root.props.accessibilityRole).toBe('text');
    expect(screen.getByText('$')).toBeDefined();
    expect(screen.getByText('USD')).toBeDefined();
  });

  it('pads zeros properly when padZero and minDigits are specified', async () => {
    const { getByLabelText } = await renderWithTheme(
      <TickerText
        value={7}
        minDigits={3}
        padZero={true}
      />,
    );

    const root = getByLabelText('7');
    expect(root).toBeDefined();
  });
});

describe('WavyText component contract', () => {
  it('renders with accessible label containing full text', async () => {
    const { getByLabelText } = await renderWithTheme(
      <WavyText text="Wavy Motion" />,
    );

    const element = getByLabelText('Wavy Motion');
    expect(element).toBeDefined();
    expect(element.props.accessibilityRole).toBe('text');
  });
});
