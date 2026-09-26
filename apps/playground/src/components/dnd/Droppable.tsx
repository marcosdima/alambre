import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useDroppable } from './useDroppable';

export type DroppableRenderProps = {
  isOver: boolean;
};

export type DroppableProps = {
  id: string;
  data?: unknown;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children?: ReactNode | ((props: DroppableRenderProps) => ReactNode);
};

export default function Droppable({
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
        styles.zone,
        style,
        isOver && (activeStyle ?? styles.zoneActive),
      ]}
    >
      {typeof children === 'function' ? children({ isOver }) : children}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneActive: {
    borderStyle: 'solid',
    transform: [{ scale: 1.02 }],
  },
});
