import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export type SortableItem = {
  id: string;
};

export type DropAnimationMode = 'seamless' | 'bounce' | 'impact' | 'instant';

export type SortableRowProps<T extends SortableItem> = {
  items: T[];
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  itemWidth?: number;
  gap?: number;
  springDamping?: number;
  springStiffness?: number;
  dropAnimationMode?: DropAnimationMode;
  slowMotion?: boolean;
  activeScale?: number;
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
  dropAnimationMode: DropAnimationMode;
  slowMotion: boolean;
  activeScale: number;
  disabled: boolean;
  activeDragIndex: SharedValue<number>;
  activeDragTranslationX: SharedValue<number>;
  hoverIndex: SharedValue<number>;
  isSettling: SharedValue<boolean>;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  onSwap: (fromIndex: number, toIndex: number) => void;
};

function getScaledSpring(
  baseDamping: number,
  baseStiffness: number,
  speedMult: number,
) {
  'worklet';
  if (speedMult <= 1) {
    return { damping: baseDamping, stiffness: baseStiffness };
  }
  return {
    damping: Math.max(1, baseDamping / speedMult),
    stiffness: Math.max(1, baseStiffness / (speedMult * speedMult)),
  };
}

function SortableRowItem<T extends SortableItem>({
  item,
  index,
  total,
  itemWidth,
  gap,
  springDamping,
  springStiffness,
  dropAnimationMode,
  slowMotion,
  activeScale,
  disabled,
  activeDragIndex,
  activeDragTranslationX,
  hoverIndex,
  isSettling,
  renderItem,
  onSwap,
}: SortableRowItemProps<T>) {
  const [isDraggingState, setIsDraggingState] = useState(false);
  const scale = useSharedValue(1);
  const zIndexVal = useSharedValue(0);

  const slotSize = itemWidth + gap;
  const speedMult = slowMotion ? 4 : 1;

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
      if (isSettling.value) return;

      activeDragIndex.value = index;
      activeDragTranslationX.value = 0;
      hoverIndex.value = index;
      scale.value = withSpring(activeScale, getScaledSpring(springDamping, springStiffness, speedMult));
      zIndexVal.value = 999;
      runOnJS(setIsDraggingState)(true);
    })
    .onUpdate((e) => {
      'worklet';
      if (activeDragIndex.value !== index || isSettling.value) return;

      activeDragTranslationX.value = e.translationX;

      const rawSlots = Math.round(e.translationX / slotSize);
      const currentHover = Math.max(0, Math.min(total - 1, index + rawSlots));
      hoverIndex.value = currentHover;
    })
    .onEnd((_e) => {
      'worklet';
      if (activeDragIndex.value !== index) return;

      const targetIndex = hoverIndex.value;
      const willSwap = targetIndex !== -1 && targetIndex !== index;
      isSettling.value = true;

      // Drop spring configurations based on mode
      let baseDropDamping = springDamping;
      let baseDropStiffness = springStiffness;

      if (dropAnimationMode === 'bounce') {
        baseDropDamping = 12;
        baseDropStiffness = 170;
      } else if (dropAnimationMode === 'seamless') {
        baseDropDamping = 26;
        baseDropStiffness = 260;
      } else if (dropAnimationMode === 'impact') {
        baseDropDamping = 24;
        baseDropStiffness = 260;
      }

      const dropSpring = getScaledSpring(baseDropDamping, baseDropStiffness, speedMult);

      if (!willSwap) {
        // Dropped without moving to a new slot: spring back to 0 in original slot
        scale.value = withSpring(1, dropSpring);
        activeDragTranslationX.value = withSpring(0, dropSpring, (finished) => {
          if (finished) {
            activeDragIndex.value = -1;
            hoverIndex.value = -1;
            isSettling.value = false;
            zIndexVal.value = 0;
            runOnJS(setIsDraggingState)(false);
          }
        });
        return;
      }

      // Swapping slots! Target slot offset relative to origin slot:
      const targetSlotOffset = (targetIndex - index) * slotSize;

      const finishSwap = () => {
        'worklet';
        runOnJS(setIsDraggingState)(false);
        runOnJS(handleSwapJS)(index, targetIndex);
      };

      if (dropAnimationMode === 'instant') {
        activeDragTranslationX.value = targetSlotOffset;
        scale.value = 1;
        zIndexVal.value = 0;
        finishSwap();
        return;
      }

      if (dropAnimationMode === 'impact') {
        // Glide into target slot, then trigger impact squash
        activeDragTranslationX.value = withSpring(targetSlotOffset, dropSpring, (finished) => {
          if (finished) {
            scale.value = withSequence(
              withTiming(0.92, { duration: 60 * speedMult }),
              withSpring(1, getScaledSpring(16, 240, speedMult), (impactFinished) => {
                if (impactFinished) {
                  finishSwap();
                }
              }),
            );
          }
        });
      } else {
        // 'seamless' or 'bounce'
        scale.value = withSpring(1, dropSpring);
        activeDragTranslationX.value = withSpring(targetSlotOffset, dropSpring, (finished) => {
          if (finished) {
            finishSwap();
          }
        });
      }
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
          { translateX: 0 },
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

    const neighborSpring = getScaledSpring(springDamping, springStiffness, speedMult);

    return {
      zIndex: 1,
      transform: [
        { translateX: withSpring(targetOffset, neighborSpring) },
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
  dropAnimationMode = 'seamless',
  slowMotion = false,
  activeScale = 1.08,
  containerStyle,
  disabled = false,
}: SortableRowProps<T>) {
  const activeDragIndex = useSharedValue(-1);
  const activeDragTranslationX = useSharedValue(0);
  const hoverIndex = useSharedValue(-1);
  const isSettling = useSharedValue(false);

  const handleSwap = useCallback(
    (from: number, to: number) => {
      // Synchronously reset shared values at the exact moment React re-renders with the new order
      activeDragIndex.value = -1;
      hoverIndex.value = -1;
      activeDragTranslationX.value = 0;
      isSettling.value = false;

      const copy = [...items];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      onReorder(copy);
    },
    [items, onReorder, activeDragIndex, hoverIndex, activeDragTranslationX, isSettling],
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
          dropAnimationMode={dropAnimationMode}
          slowMotion={slowMotion}
          activeScale={activeScale}
          disabled={disabled}
          activeDragIndex={activeDragIndex}
          activeDragTranslationX={activeDragTranslationX}
          hoverIndex={hoverIndex}
          isSettling={isSettling}
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
