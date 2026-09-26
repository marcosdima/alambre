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
  type SharedValue,
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
  springDamping?: number;
  springStiffness?: number;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

type SortableRowItemProps<T extends SortableItem> = {
  item: T;
  index: number;
  total: number;
  itemWidth: number;
  gap: number;
  springDamping: number;
  springStiffness: number;
  disabled: boolean;
  activeDragIndex: SharedValue<number>;
  activeDragTranslationX: SharedValue<number>;
  hoverIndex: SharedValue<number>;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  onSwap: (fromIndex: number, toIndex: number) => void;
};

function SortableRowItem<T extends SortableItem>({
  item,
  index,
  total,
  itemWidth,
  gap,
  springDamping,
  springStiffness,
  disabled,
  activeDragIndex,
  activeDragTranslationX,
  hoverIndex,
  renderItem,
  onSwap,
}: SortableRowItemProps<T>) {
  const [isDraggingState, setIsDraggingState] = useState(false);
  const scale = useSharedValue(1);
  const zIndexVal = useSharedValue(0);

  const slotSize = itemWidth + gap;
  const springCfg = { damping: springDamping, stiffness: springStiffness };

  const handleSwapJS = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (fromIdx !== toIdx && toIdx >= 0 && toIdx < total) {
        onSwap(fromIdx, toIdx);
      }
    },
    [total, onSwap],
  );

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      'worklet';
      activeDragIndex.value = index;
      activeDragTranslationX.value = 0;
      hoverIndex.value = index;
      scale.value = withSpring(1.08, springCfg);
      zIndexVal.value = 999;
      runOnJS(setIsDraggingState)(true);
    })
    .onUpdate((e) => {
      'worklet';
      activeDragTranslationX.value = e.translationX;

      const rawSlots = Math.round(e.translationX / slotSize);
      const currentHover = Math.max(0, Math.min(total - 1, index + rawSlots));
      hoverIndex.value = currentHover;
    })
    .onEnd((_e) => {
      'worklet';
      const targetIndex = hoverIndex.value;
      const willSwap = targetIndex !== -1 && targetIndex !== index;

      scale.value = withSpring(1, springCfg);
      zIndexVal.value = withTiming(0, { duration: 150 });
      runOnJS(setIsDraggingState)(false);

      if (willSwap) {
        runOnJS(handleSwapJS)(index, targetIndex);
      }

      activeDragIndex.value = -1;
      hoverIndex.value = -1;
      activeDragTranslationX.value = withSpring(0, springCfg);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isCurrentItem = activeDragIndex.value === index;
    const isAnyItemDragging = activeDragIndex.value !== -1;

    if (isCurrentItem) {
      return {
        zIndex: 999,
        transform: [
          { translateX: activeDragTranslationX.value },
          { scale: scale.value },
        ],
      };
    }

    if (!isAnyItemDragging) {
      return {
        zIndex: 0,
        transform: [
          { translateX: withSpring(0, springCfg) },
          { scale: 1 },
        ],
      };
    }

    // A neighboring item is being dragged: calculate dynamic slot shift
    const from = activeDragIndex.value;
    const to = hoverIndex.value;
    let targetOffset = 0;

    if (from < to) {
      // Dragging right: intermediate items shift LEFT
      if (index > from && index <= to) {
        targetOffset = -slotSize;
      }
    } else if (from > to) {
      // Dragging left: intermediate items shift RIGHT
      if (index >= to && index < from) {
        targetOffset = slotSize;
      }
    }

    return {
      zIndex: 1,
      transform: [
        { translateX: withSpring(targetOffset, springCfg) },
        { scale: 1 },
      ],
    };
  });

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
  itemWidth = 68,
  gap = 8,
  springDamping = 20,
  springStiffness = 240,
  containerStyle,
  disabled = false,
}: SortableRowProps<T>) {
  const activeDragIndex = useSharedValue(-1);
  const activeDragTranslationX = useSharedValue(0);
  const hoverIndex = useSharedValue(-1);

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
          springDamping={springDamping}
          springStiffness={springStiffness}
          disabled={disabled}
          activeDragIndex={activeDragIndex}
          activeDragTranslationX={activeDragTranslationX}
          hoverIndex={hoverIndex}
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
