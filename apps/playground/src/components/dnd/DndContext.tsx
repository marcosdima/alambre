import { createContext, useContext, useCallback, useRef, useState, useMemo, type ReactNode } from 'react';
import type {
  ActiveDragState,
  DndContextValue,
  DropEvent,
  DroppableRegistration,
  LayoutBounds,
} from './types';

const DndContext = createContext<DndContextValue | null>(null);

export type DndProviderProps = {
  children: ReactNode;
  onDrop?: (event: DropEvent) => void;
};

export function DndProvider({ children, onDrop }: DndProviderProps) {
  const droppablesRef = useRef<Map<string, DroppableRegistration>>(new Map());
  const activeDragRef = useRef<ActiveDragState | null>(null);
  const hoveredZoneIdRef = useRef<string | null>(null);

  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  const registerDroppable = useCallback((zone: DroppableRegistration) => {
    droppablesRef.current.set(zone.id, zone);
    return () => {
      droppablesRef.current.delete(zone.id);
    };
  }, []);

  const updateDroppableBounds = useCallback((id: string, bounds: LayoutBounds) => {
    const existing = droppablesRef.current.get(id);
    if (existing) {
      droppablesRef.current.set(id, { ...existing, bounds });
    }
  }, []);

  const measureAllDroppables = useCallback(() => {
    droppablesRef.current.forEach((zone) => {
      zone.measure?.();
    });
  }, []);

  const onDragStart = useCallback(
    (
      id: string,
      data?: unknown,
      originBounds: LayoutBounds | null = null,
      touchX?: number,
      touchY?: number,
    ) => {
      // Re-measure all droppables immediately to account for any parent scroll changes
      droppablesRef.current.forEach((zone) => {
        zone.measure?.();
      });

      const initialX = touchX ?? (originBounds ? originBounds.x + originBounds.width / 2 : 0);
      const initialY = touchY ?? (originBounds ? originBounds.y + originBounds.height / 2 : 0);

      const state: ActiveDragState = {
        id,
        data,
        touchX: initialX,
        touchY: initialY,
        originBounds,
        hoveredZoneId: null,
      };

      activeDragRef.current = state;
      hoveredZoneIdRef.current = null;
      setActiveDrag(state);
      setHoveredZoneId(null);
    },
    [],
  );

  const onDragMove = useCallback((touchX: number, touchY: number) => {
    let matchedId: string | null = null;

    droppablesRef.current.forEach((zone) => {
      if (zone.disabled) return;
      const { x, y, width, height } = zone.bounds;
      const isInside =
        touchX >= x &&
        touchX <= x + width &&
        touchY >= y &&
        touchY <= y + height;

      if (isInside) {
        matchedId = zone.id;
      }
    });

    if (hoveredZoneIdRef.current !== matchedId) {
      hoveredZoneIdRef.current = matchedId;
      setHoveredZoneId(matchedId);
    }

    if (activeDragRef.current) {
      activeDragRef.current = {
        ...activeDragRef.current,
        touchX,
        touchY,
        hoveredZoneId: matchedId,
      };
      setActiveDrag(activeDragRef.current);
    }
  }, []);

  const onDragEnd = useCallback(() => {
    let dropEvent: DropEvent | null = null;
    const currentHovered = hoveredZoneIdRef.current;
    const currentDrag = activeDragRef.current;

    if (currentDrag && currentHovered) {
      const zone = droppablesRef.current.get(currentHovered);
      if (zone && !zone.disabled) {
        dropEvent = {
          draggableId: currentDrag.id,
          draggableData: currentDrag.data,
          droppableId: zone.id,
          droppableData: zone.data,
        };
        onDrop?.(dropEvent);
      }
    }

    activeDragRef.current = null;
    hoveredZoneIdRef.current = null;
    setActiveDrag(null);
    setHoveredZoneId(null);
    return dropEvent;
  }, [onDrop]);

  const value = useMemo<DndContextValue>(
    () => ({
      registerDroppable,
      updateDroppableBounds,
      measureAllDroppables,
      activeDrag,
      onDragStart,
      onDragMove,
      onDragEnd,
      hoveredZoneId,
    }),
    [
      registerDroppable,
      updateDroppableBounds,
      measureAllDroppables,
      activeDrag,
      onDragStart,
      onDragMove,
      onDragEnd,
      hoveredZoneId,
    ],
  );

  return <DndContext.Provider value={value}>{children}</DndContext.Provider>;
}

export function useDnd(): DndContextValue {
  const ctx = useContext(DndContext);
  if (!ctx) {
    throw new Error('useDnd must be used within a DndProvider');
  }
  return ctx;
}
