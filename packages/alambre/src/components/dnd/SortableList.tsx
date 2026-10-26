import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type {
  DropAnimationMode,
  NeighborShiftMode,
  SortableItem,
  SortableListProps,
} from '../../types/dnd';

type SortableListItemProps<T extends SortableItem> = {
  item: T;
  index: number;
  total: number;
  itemHeight: number;
  gap: number;
  springDamping: number;
  springStiffness: number;
  neighborShiftMode: NeighborShiftMode;
  dragTiltDeg: number;
  reorderThreshold: number;
  dropAnimationMode: DropAnimationMode;
  slowMotion: boolean;
  activeScale: number;
  disabled: boolean;
  slotPositions: SharedValue<number[]>;
  activeDragIndex: SharedValue<number>;
  dragTranslationY: SharedValue<number>;
  dragInitialSlot: SharedValue<number>;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  onCommitOrder: () => void;
  onDirectMove: (fromIndex: number, toSlot: number) => void;
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

function SortableListItem<T extends SortableItem>({
  item,
  index,
  total,
  itemHeight,
  gap,
  springDamping,
  springStiffness,
  neighborShiftMode,
  dragTiltDeg,
  reorderThreshold,
  dropAnimationMode,
  slowMotion,
  activeScale,
  disabled,
  slotPositions,
  activeDragIndex,
  dragTranslationY,
  dragInitialSlot,
  renderItem,
  onCommitOrder,
  onDirectMove,
}: SortableListItemProps<T>) {
  const reducedMotion = useReducedMotion();
  const [isDraggingState, setIsDraggingState] = useState(false);
  const scale = useSharedValue(1);
  const zIndexVal = useSharedValue(0);

  const slotSize = itemHeight + gap;
  const speedMult = slowMotion ? 4 : 1;
  const effectiveTiltDeg = reducedMotion ? 0 : dragTiltDeg;
  const effectiveActiveScale = reducedMotion ? 1 : activeScale;

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      'worklet';
      activeDragIndex.value = index;
      dragInitialSlot.value = slotPositions.value?.[index] ?? index;
      dragTranslationY.value = 0;
      scale.value = withSpring(
        effectiveActiveScale,
        getScaledSpring(springDamping, springStiffness, speedMult),
      );
      zIndexVal.value = 999;
      runOnJS(setIsDraggingState)(true);
    })
    .onUpdate((e) => {
      'worklet';
      if (activeDragIndex.value !== index) return;

      dragTranslationY.value = e.translationY;

      const absY = Math.abs(e.translationY);
      const sign = e.translationY >= 0 ? 1 : -1;
      const rawShift =
        sign *
        Math.floor((absY + (1 - reorderThreshold) * slotSize) / slotSize);
      const targetSlot = Math.max(
        0,
        Math.min(total - 1, dragInitialSlot.value + rawShift),
      );
      const currentSlot = slotPositions.value?.[index] ?? index;

      if (targetSlot !== currentSlot) {
        const next = [...slotPositions.value];
        for (let j = 0; j < total; j++) {
          if (j === index) continue;
          const s = next[j];
          if (currentSlot < targetSlot) {
            // Dragging down: intermediate items shift up
            if (s > currentSlot && s <= targetSlot) {
              next[j] = s - 1;
            }
          } else {
            // Dragging up: intermediate items shift down
            if (s >= targetSlot && s < currentSlot) {
              next[j] = s + 1;
            }
          }
        }
        next[index] = targetSlot;
        slotPositions.value = next;
      }
    })
    .onEnd(() => {
      'worklet';
      if (activeDragIndex.value !== index) return;

      const finalSlot = slotPositions.value[index];
      const targetOffsetY = finalSlot * slotSize;
      const initialOffsetY = dragInitialSlot.value * slotSize;
      const currentVisualY = initialOffsetY + dragTranslationY.value;
      const remainingDeltaY = targetOffsetY - currentVisualY;

      activeDragIndex.value = -1;
      dragTranslationY.value = 0;
      zIndexVal.value = 0;

      const finishDrop = () => {
        'worklet';
        scale.value = withSpring(
          1,
          getScaledSpring(springDamping, springStiffness, speedMult),
          () => {
            'worklet';
            runOnJS(setIsDraggingState)(false);
            runOnJS(onCommitOrder)();
          },
        );
      };

      if (dropAnimationMode === 'instant') {
        finishDrop();
      } else if (dropAnimationMode === 'impact') {
        const bounceDistance = Math.min(10, Math.abs(remainingDeltaY) * 0.15);
        scale.value = withSequence(
          withTiming(0.94, { duration: 80 * speedMult, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 12, stiffness: 200 }, () => {
            'worklet';
            runOnJS(setIsDraggingState)(false);
            runOnJS(onCommitOrder)();
          }),
        );
        void bounceDistance;
      } else {
        finishDrop();
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const currentSlot = slotPositions.value?.[index] ?? index;
    const isActivelyDragging = activeDragIndex.value === index;

    let translateY: number;
    if (isActivelyDragging) {
      translateY = dragInitialSlot.value * slotSize + dragTranslationY.value;
    } else {
      const targetY = currentSlot * slotSize;
      if (neighborShiftMode === 'instant' || reducedMotion) {
        translateY = targetY;
      } else if (neighborShiftMode === 'linear') {
        translateY = withTiming(targetY, {
          duration: 160 * speedMult,
          easing: Easing.linear,
        });
      } else if (neighborShiftMode === 'bounce') {
        translateY = withSpring(
          targetY,
          getScaledSpring(springDamping * 0.7, springStiffness * 1.3, speedMult),
        );
      } else {
        translateY = withSpring(
          targetY,
          getScaledSpring(springDamping, springStiffness, speedMult),
        );
      }
    }

    const tilt = isActivelyDragging
      ? Math.max(-effectiveTiltDeg, Math.min(effectiveTiltDeg, dragTranslationY.value * 0.05))
      : 0;

    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      transform: [
        { translateY },
        { scale: scale.value },
        { rotate: `${tilt}deg` },
      ],
      zIndex: zIndexVal.value,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <GestureDetector gesture={panGesture}>
        <View
          collapsable={false}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Item ${item.id}, position ${index + 1} of ${total}`}
          accessibilityActions={[
            { name: 'moveUp', label: 'Move item up' },
            { name: 'moveDown', label: 'Move item down' },
          ]}
          onAccessibilityAction={(event) => {
            if (disabled) return;
            const currentSlot = slotPositions.value?.[index] ?? index;
            if (event.nativeEvent.actionName === 'moveUp' && currentSlot > 0) {
              onDirectMove(index, currentSlot - 1);
            } else if (event.nativeEvent.actionName === 'moveDown' && currentSlot < total - 1) {
              onDirectMove(index, currentSlot + 1);
            }
          }}
        >
          {renderItem(item, index, isDraggingState)}
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  itemHeight = 64,
  gap = 10,
  springDamping = 24,
  springStiffness = 220,
  neighborShiftMode = 'glide',
  dragTiltDeg = 3,
  reorderThreshold = 0.5,
  dropAnimationMode = 'seamless',
  slowMotion = false,
  activeScale = 1.04,
  containerStyle,
  disabled = false,
}: SortableListProps<T>) {
  const total = items.length;
  const initialSlots = Array.from({ length: total }, (_, i) => i);
  const slotPositions = useSharedValue<number[]>(initialSlots);
  const activeDragIndex = useSharedValue(-1);
  const dragTranslationY = useSharedValue(0);
  const dragInitialSlot = useSharedValue(0);

  const prevItemsRef = useRef(items);
  useEffect(() => {
    if (prevItemsRef.current !== items) {
      prevItemsRef.current = items;
      if (activeDragIndex.value === -1) {
        slotPositions.value = Array.from({ length: items.length }, (_, i) => i);
      }
    }
  }, [items, slotPositions, activeDragIndex]);

  const handleCommitOrder = useCallback(() => {
    const currentSlots = slotPositions.value;
    const reordered = new Array<T>(total);
    for (let i = 0; i < total; i++) {
      const slot = currentSlots[i];
      if (slot >= 0 && slot < total) {
        reordered[slot] = items[i];
      }
    }
    const finalItems = reordered.filter(Boolean);
    if (finalItems.length === total) {
      onReorder(finalItems);
    }
  }, [items, onReorder, slotPositions, total]);

  const handleDirectMove = useCallback(
    (fromIndex: number, toSlot: number) => {
      const next = [...slotPositions.value];
      const currentSlot = next[fromIndex];
      for (let j = 0; j < total; j++) {
        if (j === fromIndex) continue;
        const s = next[j];
        if (currentSlot < toSlot) {
          if (s > currentSlot && s <= toSlot) next[j] = s - 1;
        } else {
          if (s >= toSlot && s < currentSlot) next[j] = s + 1;
        }
      }
      next[fromIndex] = toSlot;
      slotPositions.value = next;
      handleCommitOrder();
    },
    [handleCommitOrder, slotPositions, total],
  );

  const totalHeight = total > 0 ? total * itemHeight + (total - 1) * gap : 0;

  return (
    <View style={[styles.container, { height: totalHeight }, containerStyle]}>
      {items.map((item, index) => (
        <SortableListItem
          key={item.id}
          item={item}
          index={index}
          total={total}
          itemHeight={itemHeight}
          gap={gap}
          springDamping={springDamping}
          springStiffness={springStiffness}
          neighborShiftMode={neighborShiftMode}
          dragTiltDeg={dragTiltDeg}
          reorderThreshold={reorderThreshold}
          dropAnimationMode={dropAnimationMode}
          slowMotion={slowMotion}
          activeScale={activeScale}
          disabled={disabled}
          slotPositions={slotPositions}
          activeDragIndex={activeDragIndex}
          dragTranslationY={dragTranslationY}
          dragInitialSlot={dragInitialSlot}
          renderItem={renderItem}
          onCommitOrder={handleCommitOrder}
          onDirectMove={handleDirectMove}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
});
