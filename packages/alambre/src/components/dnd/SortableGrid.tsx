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
  SortableGridProps,
  SortableItem,
} from '../../types/dnd';

type SortableGridItemProps<T extends SortableItem> = {
  item: T;
  index: number;
  total: number;
  numColumns: number;
  itemWidth: number;
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
  dragTranslationX: SharedValue<number>;
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

function SortableGridItem<T extends SortableItem>({
  item,
  index,
  total,
  numColumns,
  itemWidth,
  itemHeight,
  gap,
  springDamping,
  springStiffness,
  neighborShiftMode,
  dragTiltDeg,
  dropAnimationMode,
  slowMotion,
  activeScale,
  disabled,
  slotPositions,
  activeDragIndex,
  dragTranslationX,
  dragTranslationY,
  dragInitialSlot,
  renderItem,
  onCommitOrder,
  onDirectMove,
}: SortableGridItemProps<T>) {
  const reducedMotion = useReducedMotion();
  const [isDraggingState, setIsDraggingState] = useState(false);
  const scale = useSharedValue(1);
  const zIndexVal = useSharedValue(0);

  const slotWidth = itemWidth + gap;
  const slotHeight = itemHeight + gap;
  const speedMult = slowMotion ? 4 : 1;
  const totalRows = Math.ceil(total / numColumns);
  const effectiveTiltDeg = reducedMotion ? 0 : dragTiltDeg;
  const effectiveActiveScale = reducedMotion ? 1 : activeScale;

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      'worklet';
      activeDragIndex.value = index;
      dragInitialSlot.value = slotPositions.value?.[index] ?? index;
      dragTranslationX.value = 0;
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

      dragTranslationX.value = e.translationX;
      dragTranslationY.value = e.translationY;

      const initSlot = dragInitialSlot.value;
      const initCol = initSlot % numColumns;
      const initRow = Math.floor(initSlot / numColumns);

      const targetCol = Math.max(
        0,
        Math.min(
          numColumns - 1,
          Math.round((initCol * slotWidth + e.translationX) / slotWidth),
        ),
      );
      const targetRow = Math.max(
        0,
        Math.min(
          totalRows - 1,
          Math.round((initRow * slotHeight + e.translationY) / slotHeight),
        ),
      );

      const targetSlot = Math.min(total - 1, targetRow * numColumns + targetCol);
      const currentSlot = slotPositions.value?.[index] ?? index;

      if (targetSlot !== currentSlot) {
        const next = [...slotPositions.value];
        for (let j = 0; j < total; j++) {
          if (j === index) continue;
          const s = next[j];
          if (currentSlot < targetSlot) {
            if (s > currentSlot && s <= targetSlot) {
              next[j] = s - 1;
            }
          } else {
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

      activeDragIndex.value = -1;
      dragTranslationX.value = 0;
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
        scale.value = withSequence(
          withTiming(0.94, { duration: 80 * speedMult, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 12, stiffness: 200 }, () => {
            'worklet';
            runOnJS(setIsDraggingState)(false);
            runOnJS(onCommitOrder)();
          }),
        );
      } else {
        finishDrop();
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const currentSlot = slotPositions.value?.[index] ?? index;
    const isActivelyDragging = activeDragIndex.value === index;

    let posX: number;
    let posY: number;

    if (isActivelyDragging) {
      const initSlot = dragInitialSlot.value;
      const initCol = initSlot % numColumns;
      const initRow = Math.floor(initSlot / numColumns);
      posX = initCol * slotWidth + dragTranslationX.value;
      posY = initRow * slotHeight + dragTranslationY.value;
    } else {
      const col = currentSlot % numColumns;
      const row = Math.floor(currentSlot / numColumns);
      const targetX = col * slotWidth;
      const targetY = row * slotHeight;

      if (neighborShiftMode === 'instant' || reducedMotion) {
        posX = targetX;
        posY = targetY;
      } else if (neighborShiftMode === 'linear') {
        posX = withTiming(targetX, { duration: 160 * speedMult, easing: Easing.linear });
        posY = withTiming(targetY, { duration: 160 * speedMult, easing: Easing.linear });
      } else {
        const springCfg = getScaledSpring(springDamping, springStiffness, speedMult);
        posX = withSpring(targetX, springCfg);
        posY = withSpring(targetY, springCfg);
      }
    }

    const tilt = isActivelyDragging
      ? Math.max(-effectiveTiltDeg, Math.min(effectiveTiltDeg, dragTranslationX.value * 0.08))
      : 0;

    return {
      position: 'absolute',
      left: 0,
      top: 0,
      width: itemWidth,
      height: itemHeight,
      transform: [
        { translateX: posX },
        { translateY: posY },
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
            { name: 'moveLeft', label: 'Move item left' },
            { name: 'moveRight', label: 'Move item right' },
            { name: 'moveUp', label: 'Move item up' },
            { name: 'moveDown', label: 'Move item down' },
          ]}
          onAccessibilityAction={(event) => {
            if (disabled) return;
            const currentSlot = slotPositions.value?.[index] ?? index;
            if (event.nativeEvent.actionName === 'moveLeft' && currentSlot > 0) {
              onDirectMove(index, currentSlot - 1);
            } else if (event.nativeEvent.actionName === 'moveRight' && currentSlot < total - 1) {
              onDirectMove(index, currentSlot + 1);
            } else if (event.nativeEvent.actionName === 'moveUp' && currentSlot >= numColumns) {
              onDirectMove(index, currentSlot - numColumns);
            } else if (event.nativeEvent.actionName === 'moveDown' && currentSlot + numColumns < total) {
              onDirectMove(index, currentSlot + numColumns);
            }
          }}
        >
          {renderItem(item, index, isDraggingState)}
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

export function SortableGrid<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  numColumns = 3,
  itemWidth = 96,
  itemHeight = 96,
  gap = 12,
  springDamping = 24,
  springStiffness = 220,
  neighborShiftMode = 'glide',
  dragTiltDeg = 6,
  reorderThreshold = 0.5,
  dropAnimationMode = 'seamless',
  slowMotion = false,
  activeScale = 1.06,
  containerStyle,
  disabled = false,
}: SortableGridProps<T>) {
  const total = items.length;
  const initialSlots = Array.from({ length: total }, (_, i) => i);
  const slotPositions = useSharedValue<number[]>(initialSlots);
  const activeDragIndex = useSharedValue(-1);
  const dragTranslationX = useSharedValue(0);
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

  const totalRows = Math.ceil(total / numColumns);
  const totalHeight =
    totalRows > 0 ? totalRows * itemHeight + (totalRows - 1) * gap : 0;
  const totalWidth =
    numColumns * itemWidth + (numColumns - 1) * gap;

  return (
    <View
      style={[
        styles.container,
        { height: totalHeight, width: totalWidth },
        containerStyle,
      ]}
    >
      {items.map((item, index) => (
        <SortableGridItem
          key={item.id}
          item={item}
          index={index}
          total={total}
          numColumns={numColumns}
          itemWidth={itemWidth}
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
          dragTranslationX={dragTranslationX}
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
  },
});
