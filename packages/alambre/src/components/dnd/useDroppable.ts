import { useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';
import { useDnd } from './DndContext';
import type { UseDroppableOptions, UseDroppableReturn } from '../../types/dnd';

export function useDroppable({
  id,
  data,
  disabled = false,
}: UseDroppableOptions): UseDroppableReturn {
  const { registerDroppable, updateDroppableBounds, hoveredZoneId } = useDnd();
  const targetViewRef = useRef<View>(null);

  const measureZone = useCallback(() => {
    targetViewRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        updateDroppableBounds(id, { x, y, width, height });
      }
    });
  }, [id, updateDroppableBounds]);

  const handleLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      measureZone();
    },
    [measureZone],
  );

  useEffect(() => {
    const unregister = registerDroppable({
      id,
      data,
      disabled,
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      measure: measureZone,
    });

    const timer = setTimeout(measureZone, 50);

    return () => {
      clearTimeout(timer);
      unregister();
    };
  }, [id, data, disabled, registerDroppable, measureZone]);

  const isOver = hoveredZoneId === id;

  return {
    isOver,
    targetViewRef,
    handleLayout,
    measureZone,
  };
}
