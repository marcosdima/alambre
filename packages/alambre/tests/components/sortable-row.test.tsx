import { render, fireEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native';
import { SortableRow } from '../../src/components/dnd/SortableRow';

// Mock Reanimated
vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  const { View: RNView } = await import('react-native');
  return {
    default: {
      View: ({ children, style, ...props }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) =>
        React.createElement(RNView, { style, ...props }, children),
    },
    useSharedValue: vi.fn((val: unknown) => ({ value: val })),
    useAnimatedStyle: vi.fn((cb: () => unknown) => cb()),
    withSpring: vi.fn((val: unknown) => val),
    withTiming: vi.fn((val: unknown) => val),
    withSequence: vi.fn((...args: unknown[]) => args[0]),
    Easing: {
      out: vi.fn((fn: unknown) => fn),
      cubic: vi.fn(),
      quad: vi.fn(),
      linear: vi.fn(),
    },
    runOnJS: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
  };
});

// Mock Gesture Handler
vi.mock('react-native-gesture-handler', async () => {
  const React = await import('react');
  const { View: RNView } = await import('react-native');
  const panMock = {
    enabled: vi.fn().mockReturnThis(),
    onStart: vi.fn().mockReturnThis(),
    onUpdate: vi.fn().mockReturnThis(),
    onEnd: vi.fn().mockReturnThis(),
  };
  return {
    Gesture: {
      Pan: vi.fn(() => panMock),
    },
    GestureDetector: ({ children }: { children?: ReactNode }) =>
      React.createElement(RNView, null, children),
  };
});

describe('SortableRow component', () => {
  const sampleItems = [
    { id: '1', title: 'First' },
    { id: '2', title: 'Second' },
    { id: '3', title: 'Third' },
  ];

  it('renders all items via renderItem prop', async () => {
    const onReorder = vi.fn();
    const { getByText } = await render(
      <SortableRow
        items={sampleItems}
        onReorder={onReorder}
        renderItem={(item) => <Text>{item.title}</Text>}
      />,
    );

    expect(getByText('First')).toBeDefined();
    expect(getByText('Second')).toBeDefined();
    expect(getByText('Third')).toBeDefined();
  });

  it('supports accessibility actions for screen readers (moveLeft / moveRight)', async () => {
    const onReorder = vi.fn();
    const { getAllByRole } = await render(
      <SortableRow
        items={sampleItems}
        onReorder={onReorder}
        renderItem={(item) => <Text>{item.title}</Text>}
      />,
    );

    const buttons = getAllByRole('button');
    expect(buttons.length).toBe(3);

    // Trigger accessibility action on second item (index 1) to move right
    fireEvent(buttons[1], 'accessibilityAction', {
      nativeEvent: { actionName: 'moveRight' },
    });

    expect(onReorder).toHaveBeenCalledWith([
      { id: '1', title: 'First' },
      { id: '3', title: 'Third' },
      { id: '2', title: 'Second' },
    ]);
  });
});
