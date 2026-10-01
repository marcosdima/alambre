import { useEffect, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  runOnJS,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export type UseWheelPickerOptions = {
  itemCount: number;
  selected: number;
  onSelect: (val: number) => void;
  rowHeight: number;
  cycles?: number;
};

export type UseWheelPickerResult = {
  currentPosition: SharedValue<number>;
  gesture: ReturnType<typeof Gesture.Exclusive>;
  allItems: number[];
};

export function useWheelPicker({
  itemCount,
  selected,
  onSelect,
  rowHeight,
  cycles = 5,
}: UseWheelPickerOptions): UseWheelPickerResult {
  const centerBase = Math.floor(cycles / 2) * itemCount;
  const currentPosition = useSharedValue(centerBase + selected);
  const dragStartPos = useSharedValue(centerBase + selected);

  const allItems = useMemo(() => {
    const list: number[] = [];
    for (let c = 0; c < cycles; c++) {
      for (let i = 0; i < itemCount; i++) {
        list.push(i);
      }
    }
    return list;
  }, [cycles, itemCount]);

  useEffect(() => {
    const currentInt = Math.round(currentPosition.value);
    const currentWrapped = ((currentInt % itemCount) + itemCount) % itemCount;
    if (currentWrapped !== selected) {
      let diff = (selected - currentWrapped) % itemCount;
      if (diff > itemCount / 2) diff -= itemCount;
      if (diff < -itemCount / 2) diff += itemCount;
      currentPosition.value = currentInt + diff;
    }
  }, [selected, itemCount, currentPosition]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-6, 6])
        .failOffsetX([-25, 25])
        .onStart(() => {
          'worklet';
          cancelAnimation(currentPosition);
          dragStartPos.value = currentPosition.value;
        })
        .onUpdate((e) => {
          'worklet';
          currentPosition.value = dragStartPos.value - e.translationY / rowHeight;
        })
        .onEnd((e) => {
          'worklet';
          const velocityRows = -(e.velocityY * 0.08) / rowHeight;
          const target = Math.round(currentPosition.value + velocityRows);

          currentPosition.value = withSpring(
            target,
            {
              damping: 24,
              stiffness: 220,
              mass: 0.6,
            },
            (finished) => {
              if (finished) {
                const newSelected = ((target % itemCount) + itemCount) % itemCount;
                if (Math.abs(target - centerBase) > itemCount * 1.5) {
                  currentPosition.value = centerBase + newSelected;
                }
                runOnJS(onSelect)(newSelected);
              }
            },
          );
        }),
    [centerBase, currentPosition, dragStartPos, itemCount, onSelect, rowHeight],
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .onEnd((e) => {
          'worklet';
          if (e.y < rowHeight) {
            const target = Math.round(currentPosition.value) - 1;
            currentPosition.value = withTiming(target, { duration: 150 }, (finished) => {
              if (finished) {
                const newSelected = ((target % itemCount) + itemCount) % itemCount;
                runOnJS(onSelect)(newSelected);
              }
            });
          } else if (e.y > rowHeight * 2) {
            const target = Math.round(currentPosition.value) + 1;
            currentPosition.value = withTiming(target, { duration: 150 }, (finished) => {
              if (finished) {
                const newSelected = ((target % itemCount) + itemCount) % itemCount;
                runOnJS(onSelect)(newSelected);
              }
            });
          }
        }),
    [currentPosition, itemCount, onSelect, rowHeight],
  );

  const gesture = useMemo(
    () => Gesture.Exclusive(panGesture, tapGesture),
    [panGesture, tapGesture],
  );

  return {
    currentPosition,
    gesture,
    allItems,
  };
}
