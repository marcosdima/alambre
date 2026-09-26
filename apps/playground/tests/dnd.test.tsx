import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent, renderHook, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  DndProvider,
  useDnd,
  Draggable,
  Droppable,
  SortableRow,
} from '../src/components/dnd';

describe('Drag and Drop subsystem', () => {
  describe('DndContext & DndProvider', () => {
    it('throws error when useDnd is called outside DndProvider', async () => {
      await expect(async () => {
        await renderHook(() => useDnd());
      }).rejects.toThrow('useDnd must be used within a DndProvider');
    });

    it('manages drag lifecycle and collision detection', async () => {
      const onDrop = vi.fn();
      const { result } = await renderHook(() => useDnd(), {
        wrapper: ({ children }) => <DndProvider onDrop={onDrop}>{children}</DndProvider>,
      });

      // 1. Register a droppable zone at (100, 100) with 80x80 size
      await act(async () => {
        result.current.registerDroppable({
          id: 'zone-1',
          data: { slot: 'A' },
          bounds: { x: 100, y: 100, width: 80, height: 80 },
        });
      });

      // 2. Start drag outside the zone
      await act(async () => {
        result.current.onDragStart('card-1', { cardName: 'Ace' }, null, 10, 10);
      });

      expect(result.current.activeDrag).toBeDefined();
      expect(result.current.activeDrag?.id).toBe('card-1');
      expect(result.current.hoveredZoneId).toBeNull();

      // 3. Move drag inside the zone bounds (120, 120)
      await act(async () => {
        result.current.onDragMove(120, 120);
      });

      expect(result.current.hoveredZoneId).toBe('zone-1');

      // 4. Move drag outside the zone bounds (300, 300)
      await act(async () => {
        result.current.onDragMove(300, 300);
      });

      expect(result.current.hoveredZoneId).toBeNull();

      // 5. Move back inside and end drag (drop)
      await act(async () => {
        result.current.onDragMove(140, 140);
      });

      let dropEvent: unknown = null;
      await act(async () => {
        dropEvent = result.current.onDragEnd();
      });

      expect(dropEvent).toEqual({
        draggableId: 'card-1',
        draggableData: { cardName: 'Ace' },
        droppableId: 'zone-1',
        droppableData: { slot: 'A' },
      });
      expect(onDrop).toHaveBeenCalledWith(dropEvent);
      expect(result.current.activeDrag).toBeNull();
      expect(result.current.hoveredZoneId).toBeNull();
    });

    it('does not match disabled droppable zones', async () => {
      const { result } = await renderHook(() => useDnd(), {
        wrapper: ({ children }) => <DndProvider>{children}</DndProvider>,
      });

      await act(async () => {
        result.current.registerDroppable({
          id: 'zone-disabled',
          disabled: true,
          bounds: { x: 50, y: 50, width: 100, height: 100 },
        });
      });

      await act(async () => {
        result.current.onDragStart('card-1', null, null, 60, 60);
      });

      await act(async () => {
        result.current.onDragMove(60, 60);
      });

      expect(result.current.hoveredZoneId).toBeNull();
    });
  });

  describe('Draggable & Droppable components', () => {
    it('renders Draggable with accessibility semantics', async () => {
      const screen = await render(
        <DndProvider>
          <Draggable id="test-card" accessibilityLabel="Test Card Draggable">
            {({ isDragging }) => (
              <Text>{isDragging ? 'Dragging Card' : 'Idle Card'}</Text>
            )}
          </Draggable>
        </DndProvider>,
      );

      const item = screen.getByLabelText('Test Card Draggable');
      expect(item).toBeDefined();
      expect(item.props.accessibilityRole).toBe('button');
      expect(screen.getByText('Idle Card')).toBeDefined();
    });

    it('renders Droppable with proper role and active state', async () => {
      const screen = await render(
        <DndProvider>
          <Droppable id="target-zone" accessibilityLabel="Target Zone">
            {({ isOver }) => <Text>{isOver ? 'Hovering' : 'Ready'}</Text>}
          </Droppable>
        </DndProvider>,
      );

      const zone = screen.getByLabelText('Target Zone');
      expect(zone).toBeDefined();
      expect(zone.props.accessibilityRole).toBe('none');
      expect(screen.getByText('Ready')).toBeDefined();
    });
  });

  describe('SortableRow component', () => {
    it('renders items and handles accessibility reordering actions', async () => {
      const onReorder = vi.fn();
      const items = [
        { id: 'item-1', label: 'First' },
        { id: 'item-2', label: 'Second' },
        { id: 'item-3', label: 'Third' },
      ];

      const screen = await render(
        <SortableRow
          items={items}
          onReorder={onReorder}
          renderItem={(item) => <Text>{item.label}</Text>}
        />,
      );

      expect(screen.getByText('First')).toBeDefined();
      expect(screen.getByText('Second')).toBeDefined();
      expect(screen.getByText('Third')).toBeDefined();

      // Test moveRight on item 1 (index 0 -> index 1)
      const firstItem = screen.getByLabelText('Item item-1, position 1 of 3');
      fireEvent(firstItem, 'accessibilityAction', {
        nativeEvent: { actionName: 'moveRight' },
      });

      expect(onReorder).toHaveBeenCalledWith([
        { id: 'item-2', label: 'Second' },
        { id: 'item-1', label: 'First' },
        { id: 'item-3', label: 'Third' },
      ]);

      // Test moveLeft on item 2 (index 1 -> index 0)
      const secondItem = screen.getByLabelText('Item item-2, position 2 of 3');
      fireEvent(secondItem, 'accessibilityAction', {
        nativeEvent: { actionName: 'moveLeft' },
      });

      expect(onReorder).toHaveBeenCalledWith([
        { id: 'item-2', label: 'Second' },
        { id: 'item-1', label: 'First' },
        { id: 'item-3', label: 'Third' },
      ]);
    });
  });
});
