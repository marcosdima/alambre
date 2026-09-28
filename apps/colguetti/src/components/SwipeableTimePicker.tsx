import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useLightDark } from '../providers/theme';

type SwipeableTimePickerProps = {
  value: string; // "HH:MM"
  onChange: (time: string) => void;
  accentColor?: string;
  testID?: string;
};

const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 3;
const WHEEL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS; // 132
const CYCLES = 5;

type WheelColumnProps = {
  itemCount: number;
  selected: number;
  onSelect: (val: number) => void;
  format?: (val: number) => string;
  testID?: string;
};

function WheelColumn({
  itemCount,
  selected,
  onSelect,
  format = (val) => val.toString().padStart(2, '0'),
  testID,
}: WheelColumnProps) {
  const { theme } = useLightDark();
  const centerBase = Math.floor(CYCLES / 2) * itemCount;
  const currentPosition = useSharedValue(centerBase + selected);
  const dragStartPos = useSharedValue(centerBase + selected);

  const allItems = useMemo(() => {
    const list: number[] = [];
    for (let c = 0; c < CYCLES; c++) {
      for (let i = 0; i < itemCount; i++) {
        list.push(i);
      }
    }
    return list;
  }, [itemCount]);

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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ROW_HEIGHT - currentPosition.value * ROW_HEIGHT }],
  }));

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
          currentPosition.value = dragStartPos.value - e.translationY / ROW_HEIGHT;
        })
        .onEnd((e) => {
          'worklet';
          // Velocity inertia: flicking advances with momentum
          const velocityRows = -(e.velocityY * 0.08) / ROW_HEIGHT;
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
    [centerBase, currentPosition, dragStartPos, itemCount, onSelect],
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .onEnd((e) => {
          'worklet';
          if (e.y < ROW_HEIGHT) {
            const target = Math.round(currentPosition.value) - 1;
            currentPosition.value = withTiming(target, { duration: 150 }, (finished) => {
              if (finished) {
                const newSelected = ((target % itemCount) + itemCount) % itemCount;
                runOnJS(onSelect)(newSelected);
              }
            });
          } else if (e.y > ROW_HEIGHT * 2) {
            const target = Math.round(currentPosition.value) + 1;
            currentPosition.value = withTiming(target, { duration: 150 }, (finished) => {
              if (finished) {
                const newSelected = ((target % itemCount) + itemCount) % itemCount;
                runOnJS(onSelect)(newSelected);
              }
            });
          }
        }),
    [currentPosition, itemCount, onSelect],
  );

  const gesture = useMemo(
    () => Gesture.Exclusive(panGesture, tapGesture),
    [panGesture, tapGesture],
  );

  return (
    <View style={styles.wheelColumn} testID={testID}>
      <View
        pointerEvents="none"
        style={[
          styles.selectionBand,
          {
            backgroundColor: theme.primarySoft,
            borderColor: theme.primary,
          },
        ]}
      />

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.wheelContainer, animatedStyle]}>
          {allItems.map((item, index) => {
            const isSelected = item === selected;
            return (
              <View key={index} style={styles.numberRow}>
                <Text
                  style={[
                    styles.numberText,
                    {
                      color: isSelected ? theme.primary : theme.muted,
                      fontSize: isSelected ? 24 : 18,
                      fontWeight: isSelected ? '800' : '600',
                      opacity: isSelected ? 1 : 0.45,
                    },
                  ]}
                >
                  {format(item)}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function SwipeableTimePicker({
  value,
  onChange,
  testID,
}: SwipeableTimePickerProps) {
  const { theme } = useLightDark();

  const [hoursStr, minutesStr] = (value || '08:00').split(':');
  const hours = Math.max(0, Math.min(23, parseInt(hoursStr || '8', 10)));
  const minutes = Math.max(0, Math.min(59, parseInt(minutesStr || '0', 10)));

  const handleHoursChange = useCallback(
    (newH: number) => {
      const hStr = newH.toString().padStart(2, '0');
      const mStr = minutes.toString().padStart(2, '0');
      onChange(`${hStr}:${mStr}`);
    },
    [minutes, onChange],
  );

  const handleMinutesChange = useCallback(
    (newM: number) => {
      const hStr = hours.toString().padStart(2, '0');
      const mStr = newM.toString().padStart(2, '0');
      onChange(`${hStr}:${mStr}`);
    },
    [hours, onChange],
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceAlt,
          borderColor: theme.border,
        },
      ]}
      testID={testID}
    >
      <View style={styles.labelsRow}>
        <Text style={[styles.columnLabel, { color: theme.muted }]}>HORA</Text>
        <View style={styles.colonSpacer} />
        <Text style={[styles.columnLabel, { color: theme.muted }]}>MIN</Text>
      </View>

      <View style={styles.wheelsRow}>
        <WheelColumn
          itemCount={24}
          selected={hours}
          onSelect={handleHoursChange}
          testID="hours-wheel"
        />

        <View style={styles.colonContainer}>
          <Text style={[styles.colonText, { color: theme.primary }]}>:</Text>
        </View>

        <WheelColumn
          itemCount={60}
          selected={minutes}
          onSelect={handleMinutesChange}
          testID="minutes-wheel"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    width: 60,
  },
  colonSpacer: {
    width: 20,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_HEIGHT,
    width: '100%',
    maxWidth: 240,
    position: 'relative',
  },
  wheelColumn: {
    flex: 1,
    height: WHEEL_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  selectionBand: {
    position: 'absolute',
    top: ROW_HEIGHT,
    left: 4,
    right: 4,
    height: ROW_HEIGHT,
    borderRadius: 12,
    borderWidth: 1.5,
    zIndex: 0,
  },
  wheelContainer: {
    width: '100%',
    alignItems: 'center',
  },
  numberRow: {
    height: ROW_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    textAlign: 'center',
  },
  colonContainer: {
    width: 24,
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colonText: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
});
