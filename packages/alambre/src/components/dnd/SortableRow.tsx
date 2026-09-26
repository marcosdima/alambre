import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
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
  SortableRowProps,
} from '../../types/dnd';

type SortableRowItemProps<T extends SortableItem> = {
  item: T;
  index: number;
  displaySlot: number;
  total: number;
  itemWidth: number;
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

function SortableRowItem<T extends SortableItem>({
  item,
  index,
  displaySlot,
  total,
  itemWidth,
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
  dragTranslationX,
  dragInitialSlot,
  renderItem,
  onCommitOrder,
  onDirectMove,
}: SortableRowItemProps<T>) {
  const [isDraggingState, setIsDraggingState] = useState(false);
  const scale = useSharedValue(1);
  const zIndexVal = useSharedValue(0);

  const slotSize = itemWidth + gap;
  const speedMult = slowMotion ? 4 : 1;

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      'worklet';
      activeDragIndex.value = index;
      dragInitialSlot.value = slotPositions.value[index];
      dragTranslationX.value = 0;
      scale.value = withSpring(activeScale, getScaledSpring(springDamping, springStiffness, speedMult));
      zIndexVal.value = 999;
      runOnJS(setIsDraggingState)(true);
    })
    .onUpdate((e) => {
      'worklet';
      if (activeDragIndex.value !== index) return;

      dragTranslationX.value = e.translationX;

      const absX = Math.abs(e.translationX);
      const sign = e.translationX >= 0 ? 1 : -1;
      const rawShift =
        sign *
        Math.floor((absX + (1 - reorderThreshold) * slotSize) / slotSize);
      const targetSlot = Math.max(0, Math.min(total - 1, dragInitialSlot.value + rawShift));
      const currentSlot = slotPositions.value[index];

      if (targetSlot !== currentSlot) {
        const next = [...slotPositions.value];
        for (let j = 0; j < total; j++) {
          if (j === index) continue;
          const s = next[j];
          if (currentSlot < targetSlot) {
            // Dragging right: intermediate items shift left
            if (s > currentSlot && s <= targetSlot) {
              next[j] = s - 1;
            }
          } else {
            // Dragging left: intermediate items shift right
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

      const currentSlot = slotPositions.value[index];
      const targetVisualOffset = (currentSlot - index) * slotSize;
      const initialSlot = dragInitialSlot.value;
      const initialVisualOffset = (initialSlot - index) * slotSize;
      const deltaToTarget = targetVisualOffset - initialVisualOffset;

      const finishDrop = () => {
        'worklet';
        activeDragIndex.value = -1;
        scale.value = withSpring(1, { damping: 20, stiffness: 260 });
        zIndexVal.value = 0;
        runOnJS(setIsDraggingState)(false);
        runOnJS(onCommitOrder)();
      };

      if (dropAnimationMode === 'instant') {
        dragTranslationX.value = deltaToTarget;
        finishDrop();
        return;
      }

      if (dropAnimationMode === 'impact') {
        dragTranslationX.value = withTiming(
          deltaToTarget,
          { duration: 130 * speedMult, easing: Easing.out(Easing.quad) },
          (finished) => {
            if (finished) {
              scale.value = withSequence(
                withTiming(0.92, { duration: 50 * speedMult }),
                withSpring(1, getScaledSpring(16, 240, speedMult), (done) => {
                  if (done) finishDrop();
                }),
              );
            }
          },
        );
      } else if (dropAnimationMode === 'bounce') {
        scale.value = withSpring(1, getScaledSpring(14, 200, speedMult));
        dragTranslationX.value = withSpring(
          deltaToTarget,
          {
            damping: Math.max(1, 13 / Math.sqrt(speedMult)),
            stiffness: Math.max(1, 220 / speedMult),
            energyThreshold: 0.5,
          },
          (finished) => {
            if (finished) finishDrop();
          },
        );
      } else {
        // 'seamless' - quick 140ms crisp glide into slot with zero lingering delay
        scale.value = withSpring(1, getScaledSpring(24, 280, speedMult));
        dragTranslationX.value = withTiming(
          deltaToTarget,
          { duration: 140 * speedMult, easing: Easing.out(Easing.quad) },
          (finished) => {
            if (finished) finishDrop();
          },
        );
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isDragging = activeDragIndex.value === index;
    const currentSlot = slotPositions.value[index];
    const targetOffset = (currentSlot - index) * slotSize;

    if (isDragging) {
      const initialSlot = dragInitialSlot.value;
      const visualOffset = (initialSlot - index) * slotSize + dragTranslationX.value;

      let rotationStr = '0deg';
      if (dragTiltDeg > 0) {
        const normalized = Math.max(-1, Math.min(1, dragTranslationX.value / slotSize));
        const tilt = normalized * dragTiltDeg;
        rotationStr = `${tilt}deg`;
      }

      return {
        zIndex: zIndexVal.value,
        transform: [
          { translateX: visualOffset },
          { scale: scale.value },
          { rotate: rotationStr },
        ],
      };
    }

    let neighborTranslateX: number;
    if (neighborShiftMode === 'instant') {
      neighborTranslateX = targetOffset;
    } else if (neighborShiftMode === 'linear') {
      neighborTranslateX = withTiming(targetOffset, {
        duration: 150 * speedMult,
        easing: Easing.linear,
      });
    } else if (neighborShiftMode === 'glide') {
      neighborTranslateX = withTiming(targetOffset, {
        duration: 170 * speedMult,
        easing: Easing.out(Easing.cubic),
      });
    } else if (neighborShiftMode === 'damped') {
      neighborTranslateX = withSpring(
        targetOffset,
        getScaledSpring(30, 260, speedMult),
      );
    } else {
      // 'bounce'
      const neighborSpring = getScaledSpring(springDamping, springStiffness, speedMult);
      neighborTranslateX = withSpring(targetOffset, neighborSpring);
    }

    return {
      zIndex: zIndexVal.value,
      transform: [
        { translateX: neighborTranslateX },
        { scale: scale.value },
        { rotate: '0deg' },
      ],
    };
  });

  const handleAccessibilityAction = (event: { nativeEvent: { actionName: string } }) => {
    const currentSlot = slotPositions.value[index];
    if (event.nativeEvent.actionName === 'moveLeft' && currentSlot > 0) {
      onDirectMove(index, currentSlot - 1);
    } else if (event.nativeEvent.actionName === 'moveRight' && currentSlot < total - 1) {
      onDirectMove(index, currentSlot + 1);
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        collapsable={false}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Item ${item.id}, position ${displaySlot + 1} of ${total}`}
        accessibilityActions={[
          { name: 'moveLeft', label: 'Move left' },
          { name: 'moveRight', label: 'Move right' },
        ]}
        onAccessibilityAction={handleAccessibilityAction}
        style={[animatedStyle, { width: itemWidth }]}
      >
        {renderItem(item, displaySlot, isDraggingState)}
      </Animated.View>
    </GestureDetector>
  );
}

export function SortableRow<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  itemWidth = 68,
  gap = 8,
  springDamping = 20,
  springStiffness = 240,
  neighborShiftMode = 'glide',
  dragTiltDeg = 0,
  reorderThreshold = 0.5,
  dropAnimationMode = 'seamless',
  slowMotion = false,
  activeScale = 1.08,
  containerStyle,
  disabled = false,
}: SortableRowProps<T>) {
  const baselineItemsRef = useRef(items);

  const hasStructuralChange =
    items.length !== baselineItemsRef.current.length ||
    items.some((it) => !baselineItemsRef.current.some((b) => b.id === it.id));

  if (hasStructuralChange) {
    baselineItemsRef.current = items;
  }

  const baseline = baselineItemsRef.current;
  const total = baseline.length;

  const slotPositions = useSharedValue<number[]>(baseline.map((_, i) => i));
  const activeDragIndex = useSharedValue(-1);
  const dragTranslationX = useSharedValue(0);
  const dragInitialSlot = useSharedValue(0);

  useEffect(() => {
    const targetSlots = baseline.map((baseItem) => {
      const foundIdx = items.findIndex((it) => it.id === baseItem.id);
      return foundIdx !== -1 ? foundIdx : 0;
    });

    const isDifferent = targetSlots.some((slot, idx) => slot !== slotPositions.value[idx]);
    if (isDifferent) {
      slotPositions.value = targetSlots;
      activeDragIndex.value = -1;
      dragTranslationX.value = 0;
    }
  }, [items, baseline, slotPositions, activeDragIndex, dragTranslationX]);

  const handleCommitOrder = useCallback(() => {
    const ordered: T[] = new Array(total);
    for (let i = 0; i < total; i++) {
      const slot = slotPositions.value[i];
      ordered[slot] = baseline[i];
    }
    onReorder(ordered);
  }, [total, baseline, onReorder, slotPositions]);

  const handleDirectMove = useCallback(
    (itemIndex: number, targetSlot: number) => {
      const currentSlot = slotPositions.value[itemIndex];
      if (currentSlot === targetSlot) return;

      const next = [...slotPositions.value];
      for (let j = 0; j < total; j++) {
        if (j === itemIndex) continue;
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
      next[itemIndex] = targetSlot;
      slotPositions.value = next;
      handleCommitOrder();
    },
    [total, slotPositions, handleCommitOrder],
  );

  return (
    <View style={[styles.container, { gap }, containerStyle]}>
      {baseline.map((item, index) => {
        const foundSlot = items.findIndex((it) => it.id === item.id);
        const displaySlot = foundSlot !== -1 ? foundSlot : index;

        return (
          <SortableRowItem
            key={item.id}
            item={item}
            index={index}
            displaySlot={displaySlot}
            total={total}
            itemWidth={itemWidth}
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
            dragInitialSlot={dragInitialSlot}
            renderItem={renderItem}
            onCommitOrder={handleCommitOrder}
            onDirectMove={handleDirectMove}
          />
        );
      })}
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

export default SortableRow;
