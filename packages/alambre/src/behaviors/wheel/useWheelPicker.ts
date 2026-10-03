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
import { kinetics } from '../../core/kinetics';

export type UseWheelPickerOptions = {
  itemCount: number;
  selected: number;
  onSelect: (val: number) => void;
  rowHeight: number; // or itemWidth in horizontal mode
  cycles?: number;
  horizontal?: boolean;
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
  horizontal = false,
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
    () => {
      const pan = Gesture.Pan();
      if (horizontal) {
        pan.activeOffsetX([-6, 6]).failOffsetY([-25, 25]);
      } else {
        pan.activeOffsetY([-6, 6]).failOffsetX([-25, 25]);
      }

      return pan
        .onStart(() => {
          'worklet';
          cancelAnimation(currentPosition);
          dragStartPos.value = currentPosition.value;
        })
        .onUpdate((e) => {
          'worklet';
          const translation = horizontal ? e.translationX : e.translationY;
          currentPosition.value = dragStartPos.value - translation / rowHeight;
        })
        .onEnd((e) => {
          'worklet';
          const velocity = horizontal ? e.velocityX : e.velocityY;
          const velocityRows = -(velocity * 0.08) / rowHeight;
          const target = Math.round(currentPosition.value + velocityRows);

          currentPosition.value = withSpring(
            target,
            kinetics.spring.snappy,
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
        });
    },
    [centerBase, currentPosition, dragStartPos, itemCount, onSelect, rowHeight, horizontal],
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .onEnd((e) => {
          'worklet';
          const pos = horizontal ? e.x : e.y;
          if (pos < rowHeight) {
            const target = Math.round(currentPosition.value) - 1;
            currentPosition.value = withTiming(target, { duration: 150 }, (finished) => {
              if (finished) {
                const newSelected = ((target % itemCount) + itemCount) % itemCount;
                runOnJS(onSelect)(newSelected);
              }
            });
          } else if (pos > rowHeight * 2) {
            const target = Math.round(currentPosition.value) + 1;
            currentPosition.value = withTiming(target, { duration: 150 }, (finished) => {
              if (finished) {
                const newSelected = ((target % itemCount) + itemCount) % itemCount;
                runOnJS(onSelect)(newSelected);
              }
            });
          }
        }),
    [currentPosition, itemCount, onSelect, rowHeight, horizontal],
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
