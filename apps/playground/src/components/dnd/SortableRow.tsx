import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type SortableItem = {
  id: string;
};

export type SortableRowProps<T extends SortableItem> = {
  items: T[];
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  itemWidth?: number;
  gap?: number;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

type SortableRowItemProps<T extends SortableItem> = {
  item: T;
  index: number;
  total: number;
  itemWidth: number;
  gap: number;
  disabled: boolean;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  onSwap: (fromIndex: number, toIndex: number) => void;
};

function SortableRowItem<T extends SortableItem>({
  item,
  index,
  total,
  itemWidth,
  gap,
  disabled,
  renderItem,
  onSwap,
}: SortableRowItemProps<T>) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const scale = useSharedValue(1);
  const zIndexVal = useSharedValue(0);

  const slotSize = itemWidth + gap;

  const handleSwapJS = useCallback(
    (offsetIndex: number) => {
      const targetIndex = Math.max(0, Math.min(total - 1, index + offsetIndex));
      if (targetIndex !== index) {
        onSwap(index, targetIndex);
      }
    },
    [index, total, onSwap],
  );

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      scale.value = withSpring(1.08, { damping: 18, stiffness: 260 });
      zIndexVal.value = 999;
      runOnJS(setIsDraggingState)(true);
    })
    .onUpdate((e) => {
      'worklet';
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.4; // slight vertical dampening for horizontal row
    })
    .onEnd((e) => {
      'worklet';
      isDragging.value = false;
      scale.value = withSpring(1);
      zIndexVal.value = withTiming(0, { duration: 150 });
      runOnJS(setIsDraggingState)(false);

      // Determine slot shift
      const rawSlots = Math.round(e.translationX / slotSize);
      if (rawSlots !== 0) {
        runOnJS(handleSwapJS)(rawSlots);
      }

      translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: zIndexVal.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleAccessibilityAction = (event: { nativeEvent: { actionName: string } }) => {
    if (event.nativeEvent.actionName === 'moveLeft' && index > 0) {
      onSwap(index, index - 1);
    } else if (event.nativeEvent.actionName === 'moveRight' && index < total - 1) {
      onSwap(index, index + 1);
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        collapsable={false}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Item ${item.id}, position ${index + 1} of ${total}`}
        accessibilityActions={[
          { name: 'moveLeft', label: 'Move left' },
          { name: 'moveRight', label: 'Move right' },
        ]}
        onAccessibilityAction={handleAccessibilityAction}
        style={[animatedStyle, { width: itemWidth }]}
      >
        {renderItem(item, index, isDraggingState)}
      </Animated.View>
    </GestureDetector>
  );
}

export default function SortableRow<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  itemWidth = 84,
  gap = 10,
  containerStyle,
  disabled = false,
}: SortableRowProps<T>) {
  const handleSwap = useCallback(
    (from: number, to: number) => {
      const copy = [...items];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      onReorder(copy);
    },
    [items, onReorder],
  );

  return (
    <View style={[styles.container, { gap }, containerStyle]}>
      {items.map((item, index) => (
        <SortableRowItem
          key={item.id}
          item={item}
          index={index}
          total={items.length}
          itemWidth={itemWidth}
          gap={gap}
          disabled={disabled}
          renderItem={renderItem}
          onSwap={handleSwap}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
});
