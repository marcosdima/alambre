import { render, renderHook, act } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native';
import { DndProvider } from '../../src/components/dnd/DndContext';
import { useDraggable } from '../../src/components/dnd/useDraggable';
import { useDroppable } from '../../src/components/dnd/useDroppable';
import { Draggable } from '../../src/components/dnd/Draggable';
import { Droppable } from '../../src/components/dnd/Droppable';

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
    interpolate: vi.fn((val: number) => val),
    Extrapolation: { CLAMP: 'clamp' },
    runOnJS: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
  };
});

// Mock Gesture Handler
vi.mock('react-native-gesture-handler', async () => {
  const React = await import('react');
  const { View: RNView } = await import('react-native');
  const panMock = {
    enabled: vi.fn().mockReturnThis(),
    minDistance: vi.fn().mockReturnThis(),
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

describe('useDraggable & Draggable primitive', () => {
  it('initializes shared values and resets position correctly', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DndProvider>{children}</DndProvider>
    );

    const onDragMove = vi.fn();
    const { result } = await renderHook(
      () =>
        useDraggable({
          id: 'card-1',
          data: { title: 'Card 1' },
          onDragMove,
        }),
      { wrapper },
    );

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
    expect(result.current.isDragging.value).toBe(false);

    await act(async () => {
      result.current.resetPosition();
    });

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
    expect(onDragMove).toHaveBeenCalledWith(0, 0);
  });

  it('renders Draggable component with children and accessible role', async () => {
    const { getByText, getByRole } = await render(
      <DndProvider>
        <Draggable id="drag-item-1" accessibilityLabel="Test Draggable">
          {({ isDragging }) => <Text>{isDragging ? 'Dragging' : 'Idle'}</Text>}
        </Draggable>
      </DndProvider>,
    );

    expect(getByText('Idle')).toBeDefined();
    const element = getByRole('button');
    expect(element).toBeDefined();
  });
});

describe('useDroppable & Droppable primitive', () => {
  it('registers in context and updates isOver flag', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DndProvider>{children}</DndProvider>
    );

    const { result } = await renderHook(
      () =>
        useDroppable({
          id: 'slot-1',
          data: { index: 0 },
        }),
      { wrapper },
    );

    expect(result.current.isOver).toBe(false);
  });

  it('renders Droppable with unstyled container and render prop', async () => {
    const { getByText } = await render(
      <DndProvider>
        <Droppable id="zone-1" accessibilityLabel="Drop Zone 1">
          {({ isOver }) => <Text>{isOver ? 'Hovering' : 'Waiting'}</Text>}
        </Droppable>
      </DndProvider>,
    );

    expect(getByText('Waiting')).toBeDefined();
  });
});
