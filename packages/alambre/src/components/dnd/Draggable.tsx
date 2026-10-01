import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useDnd } from './DndContext';
import { useDraggable } from './useDraggable';
import type { DraggableProps } from '../../types/dnd';

export function Draggable<T = unknown>({
  id,
  data,
  disabled = false,
  kinetics,
  onDragStart,
  onDragMove,
  onDragEnd,
  style,
  accessibilityLabel,
  children,
}: DraggableProps<T>) {
  const {
    panGesture,
    animatedStyle,
    targetViewRef,
    handleLayout,
  } = useDraggable<T>({
    id,
    data,
    disabled,
    kinetics,
    onDragStart,
    onDragMove,
    onDragEnd,
  });

  const { activeDrag } = useDnd();
  const isDragging = activeDrag?.id === id;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        ref={targetViewRef}
        onLayout={handleLayout}
        collapsable={false}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `Draggable item ${id}`}
        style={[animatedStyle, style]}
      >
        {typeof children === 'function' ? children({ isDragging }) : children}
      </Animated.View>
    </GestureDetector>
  );
}

export default Draggable;
