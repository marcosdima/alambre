import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SortableList } from '../../src/components/dnd/SortableList';
import { SortableGrid } from '../../src/components/dnd/SortableGrid';
import type { SortableItem } from '../../src/types/dnd';

interface TestItem extends SortableItem {
  name: string;
}

const mockGesturePan = vi.fn();
const panInstances: any[] = [];

vi.mock('react-native-gesture-handler', async () => {
  const ReactActual = await import('react');
  const { View: RNView } = await import('react-native');

  return {
    Gesture: {
      Pan: vi.fn(() => {
        const inst: any = {
          _enabled: true,
          enabled: vi.fn((en: boolean) => {
            inst._enabled = en;
            return inst;
          }),
          onStart: vi.fn(() => inst),
          onUpdate: vi.fn(() => inst),
          onEnd: vi.fn(() => inst),
        };
        mockGesturePan(inst);
        panInstances.push(inst);
        return inst;
      }),
    },
    GestureDetector: ({ children }: { children?: React.ReactNode }) =>
      ReactActual.createElement(RNView, null, children),
  };
});

let isRenderingComponent = false;
const renderValueAccesses: { initial: any; stack?: string }[] = [];

vi.mock('react-native-reanimated', async () => {
  const ReactActual = await import('react');
  const { View: RNView } = await import('react-native');

  const AnimatedView = ReactActual.forwardRef<unknown, any>(({ children, ...props }, ref) =>
    ReactActual.createElement(RNView, { ...props, ref: ref as any } as any, children),
  );

  return {
    default: {
      View: AnimatedView,
    },
    useReducedMotion: () => false,
    useAnimatedStyle: () => ({}),
    useSharedValue: (initial: any) => {
      const ref = ReactActual.useRef<any>(null);
      if (!ref.current) {
        let val = initial;
        ref.current = {
          get value() {
            if (isRenderingComponent) {
              renderValueAccesses.push({ initial, stack: new Error().stack });
            }
            return val;
          },
          set value(v: any) {
            val = v;
          },
        };
      }
      return ref.current;
    },
    withSpring: (toValue: any) => toValue,
    withTiming: (toValue: any) => toValue,
    withSequence: (...animations: any[]) => animations[animations.length - 1],
    Easing: {
      out: (fn: any) => fn,
      quad: vi.fn(),
      linear: vi.fn(),
    },
    runOnJS: (fn: (...args: any[]) => any) => fn,
  };
});

describe('SortableList & SortableGrid components', () => {
  const sampleItems: TestItem[] = [
    { id: 'item-1', name: 'Alpha' },
    { id: 'item-2', name: 'Bravo' },
    { id: 'item-3', name: 'Charlie' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    panInstances.length = 0;
    renderValueAccesses.length = 0;
    isRenderingComponent = false;
  });

  describe('SortableList', () => {
    it('renders all items via renderItem prop with item details', async () => {
      const onReorder = vi.fn();
      const renderItemSpy = vi.fn((item: TestItem, index: number, isDragging: boolean) => (
        <View testID={`item-${item.id}`}>
          <Text>{item.name}</Text>
          <Text testID={`slot-${index}`}>Index: {index}, Dragging: {String(isDragging)}</Text>
        </View>
      ));

      const { getByText, getByTestId } = await render(
        <SortableList
          items={sampleItems}
          onReorder={onReorder}
          renderItem={renderItemSpy}
        />,
      );

      expect(getByText('Alpha')).toBeDefined();
      expect(getByText('Bravo')).toBeDefined();
      expect(getByText('Charlie')).toBeDefined();
      expect(getByTestId('item-item-1')).toBeDefined();
      expect(renderItemSpy).toHaveBeenCalledTimes(3);
    });

    it('calculates dynamic container height based on total items, itemHeight, and gap', async () => {
      const onReorder = vi.fn();

      // 3 items * 64 + 2 * 10 = 192 + 20 = 212
      const { toJSON } = await render(
        <SortableList
          items={sampleItems}
          itemHeight={64}
          gap={10}
          onReorder={onReorder}
          renderItem={(item) => <Text>{item.name}</Text>}
        />,
      );

      const root = toJSON() as any;
      const flat = StyleSheet.flatten(root.props.style);
      expect(flat.height).toBe(212);
    });

    it('collapses container height to 0 when items array is empty', async () => {
      const onReorder = vi.fn();
      const { toJSON } = await render(
        <SortableList
          items={[] as TestItem[]}
          itemHeight={64}
          gap={10}
          onReorder={onReorder}
          renderItem={(item) => <Text>{item.name}</Text>}
        />,
      );

      const root = toJSON() as any;
      const flat = StyleSheet.flatten(root.props.style);
      expect(flat.height).toBe(0);
    });

    it('displays slot positions in accessible labels for screen readers without accessing .value during render', async () => {
      const onReorder = vi.fn();

      renderValueAccesses.length = 0;
      isRenderingComponent = true;
      let renderResult: any;
      try {
        renderResult = await render(
          <SortableList
            items={sampleItems}
            onReorder={onReorder}
            renderItem={(item) => <Text>{item.name}</Text>}
          />,
        );
      } finally {
        isRenderingComponent = false;
      }

      // Verify that NO shared value was read during component render phase
      expect(renderValueAccesses).toHaveLength(0);

      const buttons = renderResult.getAllByRole('button');
      expect(buttons.length).toBe(3);
      expect(buttons[0].props.accessibilityLabel).toBe('Item item-1, position 1 of 3');
      expect(buttons[1].props.accessibilityLabel).toBe('Item item-2, position 2 of 3');
      expect(buttons[2].props.accessibilityLabel).toBe('Item item-3, position 3 of 3');
    });

    it('handles downward move commitment via accessibilityAction', async () => {
      const onReorder = vi.fn();
      const { getAllByRole } = await render(
        <SortableList
          items={sampleItems}
          onReorder={onReorder}
          renderItem={(item) => <Text>{item.name}</Text>}
        />,
      );

      const buttons = getAllByRole('button');

      // Move first item (index 0, Alpha) down to position 2
      await fireEvent(buttons[0], 'accessibilityAction', {
        nativeEvent: { actionName: 'moveDown' },
      });

      expect(onReorder).toHaveBeenCalledWith([
        { id: 'item-2', name: 'Bravo' },
        { id: 'item-1', name: 'Alpha' },
        { id: 'item-3', name: 'Charlie' },
      ]);
    });

    it('handles upward move commitment via accessibilityAction', async () => {
      const onReorder = vi.fn();
      const { getAllByRole } = await render(
        <SortableList
          items={sampleItems}
          onReorder={onReorder}
          renderItem={(item) => <Text>{item.name}</Text>}
        />,
      );

      const buttons = getAllByRole('button');

      // Move third item (index 2, Charlie) up to position 2
      await fireEvent(buttons[2], 'accessibilityAction', {
        nativeEvent: { actionName: 'moveUp' },
      });

      expect(onReorder).toHaveBeenCalledWith([
        { id: 'item-1', name: 'Alpha' },
        { id: 'item-3', name: 'Charlie' },
        { id: 'item-2', name: 'Bravo' },
      ]);
    });

    it('ignores boundary moves (moveUp on first item or moveDown on last item)', async () => {
      const onReorder = vi.fn();
      const { getAllByRole } = await render(
        <SortableList
          items={sampleItems}
          onReorder={onReorder}
          renderItem={(item) => <Text>{item.name}</Text>}
        />,
      );

      const buttons = getAllByRole('button');

      // moveUp on first item
      await fireEvent(buttons[0], 'accessibilityAction', {
        nativeEvent: { actionName: 'moveUp' },
      });
      expect(onReorder).not.toHaveBeenCalled();

      // moveDown on last item
      await fireEvent(buttons[2], 'accessibilityAction', {
        nativeEvent: { actionName: 'moveDown' },
      });
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('disables gesture and ignores accessibility actions when disabled is true', async () => {
      const onReorder = vi.fn();
      const { getAllByRole } = await render(
        <SortableList
          items={sampleItems}
          disabled={true}
          onReorder={onReorder}
          renderItem={(item) => <Text>{item.name}</Text>}
        />,
      );

      expect(panInstances.length).toBeGreaterThan(0);
      expect(panInstances.every((p) => p._enabled === false)).toBe(true);

      const buttons = getAllByRole('button');
      await fireEvent(buttons[0], 'accessibilityAction', {
        nativeEvent: { actionName: 'moveDown' },
      });

      expect(onReorder).not.toHaveBeenCalled();
    });
  });

  describe('SortableGrid', () => {
    const gridItems: TestItem[] = [
      { id: 'g-1', name: 'G1' },
      { id: 'g-2', name: 'G2' },
      { id: 'g-3', name: 'G3' },
      { id: 'g-4', name: 'G4' },
      { id: 'g-5', name: 'G5' },
    ];

    it('renders all grid items with correct width and calculated height', async () => {
      const onReorder = vi.fn();

      // 5 items with 3 columns => 2 rows
      // totalRows = 2
      // height = 2 * 96 + 1 * 12 = 204
      // width = 3 * 96 + 2 * 12 = 288 + 24 = 312
      const { getByText, toJSON } = await render(
        <SortableGrid
          items={gridItems}
          numColumns={3}
          itemWidth={96}
          itemHeight={96}
          gap={12}
          onReorder={onReorder}
          renderItem={(item) => <Text>{item.name}</Text>}
        />,
      );

      expect(getByText('G1')).toBeDefined();
      expect(getByText('G5')).toBeDefined();

      const root = toJSON() as any;
      const flat = StyleSheet.flatten(root.props.style);
      expect(flat.height).toBe(204);
      expect(flat.width).toBe(312);
    });

    it('displays slot positions in accessible labels for 2D grid items without accessing .value during render', async () => {
      const onReorder = vi.fn();

      renderValueAccesses.length = 0;
      isRenderingComponent = true;
      let gridResult: any;
      try {
        gridResult = await render(
          <SortableGrid
            items={gridItems}
            numColumns={3}
            onReorder={onReorder}
            renderItem={(item) => <Text>{item.name}</Text>}
          />,
        );
      } finally {
        isRenderingComponent = false;
      }

      // Verify that NO shared value was read during component render phase
      expect(renderValueAccesses).toHaveLength(0);

      const buttons = gridResult.getAllByRole('button');
      expect(buttons.length).toBe(5);
      expect(buttons[0].props.accessibilityLabel).toBe('Item g-1, position 1 of 5');
      expect(buttons[1].props.accessibilityLabel).toBe('Item g-2, position 2 of 5');
      expect(buttons[2].props.accessibilityLabel).toBe('Item g-3, position 3 of 5');
      expect(buttons[3].props.accessibilityLabel).toBe('Item g-4, position 4 of 5');
      expect(buttons[4].props.accessibilityLabel).toBe('Item g-5, position 5 of 5');
    });

    it('handles horizontal and vertical 2D grid reordering commitments via accessibilityAction', async () => {
      const onReorder = vi.fn();
      const { getAllByRole } = await render(
        <SortableGrid
          items={gridItems}
          numColumns={3}
          onReorder={onReorder}
          renderItem={(item) => <Text>{item.name}</Text>}
        />,
      );

      const buttons = getAllByRole('button');

      // Move first item (g-1) right to slot 1
      await fireEvent(buttons[0], 'accessibilityAction', {
        nativeEvent: { actionName: 'moveRight' },
      });

      expect(onReorder).toHaveBeenCalledWith([
        { id: 'g-2', name: 'G2' },
        { id: 'g-1', name: 'G1' },
        { id: 'g-3', name: 'G3' },
        { id: 'g-4', name: 'G4' },
        { id: 'g-5', name: 'G5' },
      ]);

      onReorder.mockClear();

      // Move first item down by 1 row (numColumns = 3 => target slot = 0 + 3 = 3)
      await fireEvent(buttons[0], 'accessibilityAction', {
        nativeEvent: { actionName: 'moveDown' },
      });

      expect(onReorder).toHaveBeenCalledWith([
        { id: 'g-2', name: 'G2' },
        { id: 'g-3', name: 'G3' },
        { id: 'g-4', name: 'G4' },
        { id: 'g-5', name: 'G5' },
        { id: 'g-1', name: 'G1' },
      ]);
    });

    it('disables grid interactions when disabled prop is true', async () => {
      const onReorder = vi.fn();
      const { getAllByRole } = await render(
        <SortableGrid
          items={gridItems}
          disabled={true}
          onReorder={onReorder}
          renderItem={(item) => <Text>{item.name}</Text>}
        />,
      );

      expect(panInstances.length).toBeGreaterThan(0);
      expect(panInstances.every((p) => p._enabled === false)).toBe(true);

      const buttons = getAllByRole('button');
      await fireEvent(buttons[0], 'accessibilityAction', {
        nativeEvent: { actionName: 'moveRight' },
      });

      expect(onReorder).not.toHaveBeenCalled();
    });
  });
});
