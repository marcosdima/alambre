import { View } from 'react-native';
import { useDroppable } from './useDroppable';
import type { DroppableProps } from '../../types/dnd';

export function Droppable({
  id,
  data,
  disabled = false,
  style,
  activeStyle,
  accessibilityLabel,
  children,
}: DroppableProps) {
  const { isOver, targetViewRef, handleLayout } = useDroppable({
    id,
    data,
    disabled,
  });

  return (
    <View
      ref={targetViewRef}
      onLayout={handleLayout}
      collapsable={false}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel ?? `Drop target zone ${id}`}
      style={[
        style,
        isOver && activeStyle,
      ]}
    >
      {typeof children === 'function' ? children({ isOver }) : children}
    </View>
  );
}

export default Droppable;
