import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { DndProvider, useDnd } from '../../src/components/dnd/DndContext';

describe('DndContext & DndProvider', () => {
  it('throws when useDnd is called outside DndProvider', () => {
    expect(() => renderHook(() => useDnd())).toThrow(
      'useDnd must be used within a DndProvider',
    );
  });

  it('provides registerDroppable, activeDrag, and coordinates management', () => {
    const onDrop = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DndProvider onDrop={onDrop}>{children}</DndProvider>
    );

    const { result } = renderHook(() => useDnd(), { wrapper });

    expect(result.current.activeDrag).toBeNull();
    expect(result.current.hoveredZoneId).toBeNull();

    // Register a droppable zone
    let unregister: (() => void) | undefined;
    act(() => {
      unregister = result.current.registerDroppable({
        id: 'zone-1',
        data: { target: 'trash' },
        bounds: { x: 100, y: 100, width: 80, height: 80 },
      });
    });

    // Start dragging
    act(() => {
      result.current.onDragStart('drag-1', { type: 'item' }, { x: 0, y: 0, width: 50, height: 50 }, 25, 25);
    });

    expect(result.current.activeDrag?.id).toBe('drag-1');
    expect(result.current.activeDrag?.touchX).toBe(25);
    expect(result.current.activeDrag?.touchY).toBe(25);

    // Move outside zone
    act(() => {
      result.current.onDragMove(50, 50);
    });
    expect(result.current.hoveredZoneId).toBeNull();

    // Move inside zone-1 (bounds: x: 100..180, y: 100..180)
    act(() => {
      result.current.onDragMove(120, 120);
    });
    expect(result.current.hoveredZoneId).toBe('zone-1');

    // End drag over zone-1
    let dropEvent: unknown;
    act(() => {
      dropEvent = result.current.onDragEnd();
    });

    expect(dropEvent).toEqual({
      draggableId: 'drag-1',
      draggableData: { type: 'item' },
      droppableId: 'zone-1',
      droppableData: { target: 'trash' },
    });
    expect(onDrop).toHaveBeenCalledWith(dropEvent);
    expect(result.current.activeDrag).toBeNull();
    expect(result.current.hoveredZoneId).toBeNull();

    // Clean up
    act(() => {
      unregister?.();
    });
  });

  it('updates droppable bounds and handles disabled zones', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DndProvider>{children}</DndProvider>
    );

    const { result } = renderHook(() => useDnd(), { wrapper });

    act(() => {
      result.current.registerDroppable({
        id: 'zone-disabled',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        disabled: true,
      });
    });

    act(() => {
      result.current.onDragStart('drag-2');
      result.current.onDragMove(50, 50);
    });

    // Disabled zones should not be hovered
    expect(result.current.hoveredZoneId).toBeNull();

    act(() => {
      const drop = result.current.onDragEnd();
      expect(drop).toBeNull();
    });
  });
});
