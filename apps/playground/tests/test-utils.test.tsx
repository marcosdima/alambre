import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { RenderResult } from '@testing-library/react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { LightDarkProvider } from '../src/providers/theme';
import { TestCard } from '../src/components/test-utils/TestCard';
import { ConfigSlider } from '../src/components/test-utils/ConfigSlider';
import { GummyTabs } from '../src/components/test-utils/GummyTabs';
import { ConfigSwitch } from '../src/components/test-utils/ConfigSwitch';

type TestInstance = NonNullable<RenderResult['root']>;

const renderWithTheme = async (ui: ReactElement) => {
  return await render(<LightDarkProvider>{ui}</LightDarkProvider>);
};

const getSlider = (screen: RenderResult, labelText: string): TestInstance => {
  const label = screen.getByText(labelText);
  const container = label.parent?.parent;
  const slider = container?.children?.find(
    (c): c is TestInstance =>
      typeof c === 'object' && c !== null && (c as TestInstance).props?.accessibilityRole === 'adjustable',
  );
  if (!slider) {
    throw new Error(`Slider for label "${labelText}" not found`);
  }
  return slider;
};


describe('Playground test-utils suite', () => {
  describe('TestCard', () => {
    it('renders title, description, and children content', async () => {
      const screen = await renderWithTheme(
        <TestCard title="Component Benchmark" description="Performance evaluation">
          <Text testID="card-child">Inner metrics display</Text>
        </TestCard>,
      );

      expect(screen.getByText('Component Benchmark')).toBeDefined();
      expect(screen.getByText('Performance evaluation')).toBeDefined();
      expect(screen.getByTestId('card-child')).toBeDefined();
    });

    it('renders correctly without optional description', async () => {
      const screen = await renderWithTheme(
        <TestCard title="Simple Header">
          <Text>Only child</Text>
        </TestCard>,
      );

      expect(screen.getByText('Simple Header')).toBeDefined();
      expect(screen.getByText('Only child')).toBeDefined();
    });

    it('triggers onPress callback when interactive', async () => {
      const onPress = vi.fn();
      const screen = await renderWithTheme(
        <TestCard title="Clickable Card" onPress={onPress}>
          <Text>Click target</Text>
        </TestCard>,
      );

      const button = screen.getByRole('button');
      expect(button).toBeDefined();

      fireEvent.press(button);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('prevents onPress execution when disabled', async () => {
      const onPress = vi.fn();
      const screen = await renderWithTheme(
        <TestCard title="Disabled Card" onPress={onPress} disabled>
          <Text>Disabled content</Text>
        </TestCard>,
      );

      const button = screen.getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);

      fireEvent.press(button);
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('ConfigSlider', () => {
    it('renders label and formatted value badge', async () => {
      const onChange = vi.fn();
      const screen = await renderWithTheme(
        <ConfigSlider label="Animation Speed" value={42} min={0} max={100} onChange={onChange} />,
      );

      expect(screen.getByText('Animation Speed')).toBeDefined();
      expect(screen.getByText('42')).toBeDefined();
    });

    it('supports accessibility actions to increment and decrement value', async () => {
      const onChange = vi.fn();
      const screen = await renderWithTheme(
        <ConfigSlider
          label="Volume Level"
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={onChange}
        />,
      );

      const slider = getSlider(screen, 'Volume Level');
      expect(slider).toBeDefined();
      expect(slider.props.accessibilityValue.now).toBe(50);
      expect(slider.props.accessibilityValue.min).toBe(0);
      expect(slider.props.accessibilityValue.max).toBe(100);

      // Increment action
      await act(async () => {
        fireEvent(slider, 'accessibilityAction', {
          nativeEvent: { actionName: 'increment' },
        });
      });
      expect(onChange).toHaveBeenCalledWith(55);

      // Decrement action
      await act(async () => {
        fireEvent(slider, 'accessibilityAction', {
          nativeEvent: { actionName: 'decrement' },
        });
      });
      expect(onChange).toHaveBeenCalledWith(45);
    });

    it('triggers onChange via touch responder interactions', async () => {
      const onChange = vi.fn();
      const screen = await renderWithTheme(
        <ConfigSlider
          label="Opacity"
          value={0}
          min={0}
          max={100}
          step={1}
          onChange={onChange}
        />,
      );

      const slider = getSlider(screen, 'Opacity');
      expect(slider).toBeDefined();

      // Establish track width via layout event
      await act(async () => {
        fireEvent(slider, 'layout', {
          nativeEvent: { layout: { width: 200, height: 40, x: 0, y: 0 } },
        });
      });

      // Press at locationX = 150 (ratio = 150/200 = 0.75 -> value = 75)
      await act(async () => {
        fireEvent(slider, 'responderGrant', {
          nativeEvent: { locationX: 150 },
        });
      });

      expect(onChange).toHaveBeenCalledWith(75);
    });

    it('respects clamping boundaries with custom step and range', async () => {
      const onChange = vi.fn();
      const screen = await renderWithTheme(
        <ConfigSlider
          label="Bounded Step"
          value={100}
          min={0}
          max={100}
          step={10}
          onChange={onChange}
        />,
      );

      const slider = getSlider(screen, 'Bounded Step');
      expect(slider).toBeDefined();

      // Attempt to increment past max
      await act(async () => {
        fireEvent(slider, 'accessibilityAction', {
          nativeEvent: { actionName: 'increment' },
        });
      });
      expect(onChange).toHaveBeenCalledWith(100);
    });
  });

  describe('GummyTabs', () => {
    const mockTabs = [
      { id: 'tab-1', label: 'Overview', content: <Text testID="content-1">Overview Body</Text> },
      { id: 'tab-2', label: 'Analytics', content: <Text testID="content-2">Analytics Data</Text> },
      { id: 'tab-3', label: 'Settings', content: <Text testID="content-3">Settings Panel</Text> },
    ];

    it('renders initial tab active and mounts its content', async () => {
      const screen = await renderWithTheme(<GummyTabs tabs={mockTabs} />);

      expect(screen.getByText('Overview')).toBeDefined();
      expect(screen.getByText('Analytics')).toBeDefined();
      expect(screen.getByText('Settings')).toBeDefined();

      // Only the first tab's content should be mounted
      expect(screen.getByTestId('content-1')).toBeDefined();
      expect(screen.queryByTestId('content-2')).toBeNull();
      expect(screen.queryByTestId('content-3')).toBeNull();
    });

    it('switches active tab and swaps displayed content on press', async () => {
      const screen = await renderWithTheme(<GummyTabs tabs={mockTabs} />);

      expect(screen.getByTestId('content-1')).toBeDefined();

      // Switch to Analytics tab
      const analyticsTabButton = screen.getByText('Analytics');
      await act(async () => {
        fireEvent.press(analyticsTabButton);
      });

      expect(screen.queryByTestId('content-1')).toBeNull();
      expect(screen.getByTestId('content-2')).toBeDefined();
      expect(screen.queryByTestId('content-3')).toBeNull();

      // Switch to Settings tab
      const settingsTabButton = screen.getByText('Settings');
      await act(async () => {
        fireEvent.press(settingsTabButton);
      });

      expect(screen.queryByTestId('content-1')).toBeNull();
      expect(screen.queryByTestId('content-2')).toBeNull();
      expect(screen.getByTestId('content-3')).toBeDefined();
    });

    it('handles empty tabs array gracefully without errors', async () => {
      const screen = await renderWithTheme(<GummyTabs tabs={[]} />);
      expect(screen.toJSON()).toBeDefined();
    });

    it('handles single tab without switching errors', async () => {
      const singleTab = [
        { id: 'solo', label: 'Solo Tab', content: <Text testID="solo-content">Only tab here</Text> },
      ];
      const screen = await renderWithTheme(<GummyTabs tabs={singleTab} />);

      expect(screen.getByText('Solo Tab')).toBeDefined();
      expect(screen.getByTestId('solo-content')).toBeDefined();
    });
  });

  describe('ConfigSwitch', () => {
    it('renders label and responds to value changes', async () => {
      const onChange = vi.fn();
      const screen = await renderWithTheme(
        <ConfigSwitch label="Enable Haptics" value={false} onChange={onChange} />,
      );

      expect(screen.getByText('Enable Haptics')).toBeDefined();

      const switchComponent = screen.getByRole('switch');
      expect(switchComponent).toBeDefined();
      fireEvent(switchComponent, 'valueChange', true);

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });
});
