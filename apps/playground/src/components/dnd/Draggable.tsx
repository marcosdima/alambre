import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useDnd } from './DndContext';
import type { DraggableKineticsConfig } from './types';
import { useDraggable } from './useDraggable';

export type DraggableRenderProps = {
  isDragging: boolean;
};

export type DraggableProps<T = unknown> = {
  id: string;
  data?: T;
  disabled?: boolean;
  kinetics?: DraggableKineticsConfig;
  onDragStart?: () => void;
  onDragEnd?: (droppableId: string | null) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children: ReactNode | ((props: DraggableRenderProps) => ReactNode);
};

export default function Draggable<T = unknown>({
  id,
  data,
  disabled = false,
  kinetics,
  onDragStart,
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
