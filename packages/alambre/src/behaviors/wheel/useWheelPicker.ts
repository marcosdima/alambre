import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { kinetics } from '../../core/kinetics';
import { dispatchSensoryCue, type KineticSensoryConfig } from '../../types/sensory-kinetics';

export type UseWheelPickerOptions<TCue extends string = string> = {
  itemCount: number;
  selected: number;
  onSelect: (val: number) => void;
  rowHeight: number; // or itemWidth in horizontal mode
  cycles?: number;
  horizontal?: boolean;
  /**
   * Optional declarative sensory configuration for tick haptics and settling cues.
   */
  sensory?: KineticSensoryConfig<TCue>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

/**
 * Result returned by `useWheelPicker`.
 *
 * @warning Always destructure `{ currentPosition }` before using it inside `useAnimatedStyle`.
 * Referencing `wheel.currentPosition` causes Babel's Reanimated plugin to capture the entire `wheel`
 * object (including `gesture`), which fails on the UI thread with:
 * `[Worklets] Cannot copy value of type ExclusiveGesture.`
 */
export type UseWheelPickerResult = {
  currentPosition: SharedValue<number>;
  gesture: ReturnType<typeof Gesture.Exclusive>;
  allItems: number[];
};

export function useWheelPicker<TCue extends string = string>({
  itemCount,
  selected,
  onSelect,
  rowHeight,
  cycles = 5,
  horizontal = false,
  sensory,
  onDragStart,
  onDragEnd,
}: UseWheelPickerOptions<TCue>): UseWheelPickerResult {
  const centerBase = Math.floor(cycles / 2) * itemCount;
  const currentPosition = useSharedValue(centerBase + selected);
  const dragStartPos = useSharedValue(centerBase + selected);
  const isRecentering = useSharedValue(false);

  const sensoryRef = useRef(sensory);
  sensoryRef.current = sensory;

  const dragCallbacksRef = useRef({ onDragStart, onDragEnd });
  dragCallbacksRef.current = { onDragStart, onDragEnd };

  const tickTrigger = useCallback(() => {
    dispatchSensoryCue(sensoryRef.current?.onTick, sensoryRef.current?.store);
  }, []);

  const settleTrigger = useCallback(() => {
    dispatchSensoryCue(
      sensoryRef.current?.onLand ?? sensoryRef.current?.onPressOut,
      sensoryRef.current?.store,
    );
  }, []);

  const notifyDragStart = useCallback(() => {
    dragCallbacksRef.current.onDragStart?.();
  }, []);

  const notifyDragEnd = useCallback(() => {
    dragCallbacksRef.current.onDragEnd?.();
  }, []);

  useAnimatedReaction(
    () => {
      'worklet';
      return {
        pos: Math.round(currentPosition.value),
        recentering: isRecentering.value,
      };
    },
    (curr, prev) => {
      'worklet';
      if (
        !curr.recentering &&
        prev !== null &&
        curr.pos !== prev.pos &&
        Math.abs(curr.pos - prev.pos) <= 1
      ) {
        runOnJS(tickTrigger)();
      }
    },
    [tickTrigger, isRecentering],
  );

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

      pan
        .onStart(() => {
          'worklet';
          cancelAnimation(currentPosition);
          dragStartPos.value = currentPosition.value;
          runOnJS(notifyDragStart)();
        })
        .onUpdate((e) => {
          'worklet';
          const translation = horizontal ? e.translationX : e.translationY;
          currentPosition.value = dragStartPos.value - translation / rowHeight;
        })
        .onEnd((e) => {
          'worklet';
          runOnJS(notifyDragEnd)();
          const velocity = horizontal ? e.velocityX : e.velocityY;
          const velocityRows = -(velocity * 0.08) / rowHeight;
          const target = Math.round(currentPosition.value + velocityRows);

          currentPosition.value = withSpring(
            target,
            kinetics.spring.snappy,
            (finished) => {
              'worklet';
              if (finished) {
                const newSelected = ((target % itemCount) + itemCount) % itemCount;
                if (Math.abs(target - centerBase) > itemCount * 1.5) {
                  isRecentering.value = true;
                  currentPosition.value = centerBase + newSelected;
                  isRecentering.value = false;
                }
                runOnJS(settleTrigger)();
                runOnJS(onSelect)(newSelected);
              }
            },
          );
        });

      if (typeof (pan as any).onFinalize === 'function') {
        (pan as any).onFinalize(() => {
          'worklet';
          runOnJS(notifyDragEnd)();
        });
      }

      return pan;
    },
    [
      centerBase,
      currentPosition,
      dragStartPos,
      isRecentering,
      itemCount,
      notifyDragStart,
      notifyDragEnd,
      onSelect,
      rowHeight,
      horizontal,
      settleTrigger,
    ],
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
              'worklet';
              if (finished) {
                const newSelected = ((target % itemCount) + itemCount) % itemCount;
                runOnJS(settleTrigger)();
                runOnJS(onSelect)(newSelected);
              }
            });
          } else if (pos > rowHeight * 2) {
            const target = Math.round(currentPosition.value) + 1;
            currentPosition.value = withTiming(target, { duration: 150 }, (finished) => {
              'worklet';
              if (finished) {
                const newSelected = ((target % itemCount) + itemCount) % itemCount;
                runOnJS(settleTrigger)();
                runOnJS(onSelect)(newSelected);
              }
            });
          }
        }),
    [currentPosition, itemCount, onSelect, rowHeight, horizontal, settleTrigger],
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
