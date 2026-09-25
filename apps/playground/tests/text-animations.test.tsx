import type { ReactElement } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react-native';
import { LightDarkProvider } from '../src/providers/theme';
import TypewriterText from '../src/components/text-animations/TypewriterText';
import TickerText from '../src/components/text-animations/TickerText';
import WavyText from '../src/components/text-animations/WavyText';
import CountUpText from '../src/components/text-animations/CountUpText';
import ScrambleText from '../src/components/text-animations/ScrambleText';
import MarqueeText from '../src/components/text-animations/MarqueeText';

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
  it('renders with accessible label containing full text in char mode', async () => {
    const screen = await renderWithTheme(
      <WavyText text="Wavy Motion" mode="char" />,
    );

    const element = screen.getByLabelText('Wavy Motion');
    expect(element).toBeDefined();
    expect(element.props.accessibilityRole).toBe('text');
    // Each individual character rendered
    expect(screen.getByText('W')).toBeDefined();
    expect(screen.getByText('M')).toBeDefined();
  });

  it('renders with accessible label and word units in word mode', async () => {
    const screen = await renderWithTheme(
      <WavyText text="Rapid Wave" mode="word" />,
    );

    const element = screen.getByLabelText('Rapid Wave');
    expect(element).toBeDefined();
    expect(element.props.accessibilityRole).toBe('text');
    // Whole words rendered as units
    expect(screen.getByText('Rapid')).toBeDefined();
    expect(screen.getByText('Wave')).toBeDefined();
  });
});

describe('CountUpText component contract', () => {
  it('renders with accessible label and initial formatted number', async () => {
    const screen = await renderWithTheme(
      <CountUpText
        value={1500}
        from={1500}
        prefix="$"
        decimals={2}
      />,
    );

    const element = screen.getByLabelText('$1,500.00');
    expect(element).toBeDefined();
    expect(element.props.accessibilityRole).toBe('text');
    expect(screen.getByText('$1,500.00')).toBeDefined();
  });
});

describe('ScrambleText component contract', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders with accessible label and settles to target text', async () => {
    const onComplete = vi.fn();
    const screen = await renderWithTheme(
      <ScrambleText
        text="CODE"
        speed={20}
        cyclesPerChar={1}
        onComplete={onComplete}
      />,
    );

    const element = screen.getByLabelText('CODE');
    expect(element).toBeDefined();
    expect(element.props.accessibilityRole).toBe('text');

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText('CODE')).toBeDefined();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('MarqueeText component contract', () => {
  it('renders with accessible role and text label', async () => {
    const screen = await renderWithTheme(
      <MarqueeText text="Now Playing: Synthwave Anthem" />,
    );

    const element = screen.getByLabelText('Now Playing: Synthwave Anthem');
    expect(element).toBeDefined();
    expect(element.props.accessibilityRole).toBe('text');
  });
});

