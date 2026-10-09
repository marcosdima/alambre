import AppText from './AppText';
import { useCallback } from 'react';
import { StyleSheet,  View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useWheelPicker } from 'alambre';
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

  const { currentPosition, gesture, allItems } = useWheelPicker({
    itemCount,
    selected,
    onSelect,
    rowHeight: ROW_HEIGHT,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ROW_HEIGHT - currentPosition.value * ROW_HEIGHT }],
  }));

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
          {allItems.map((item: number, index: number) => {
            const isSelected = item === selected;
            return (
              <View key={index} style={styles.numberRow}>
                <AppText
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
                </AppText>
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
          backgroundColor: theme.surface,
          borderColor: theme.borderSoft,
        },
      ]}
      testID={testID}
    >
      <View style={styles.labelsRow}>
        <AppText style={[styles.columnLabel, { color: theme.muted }]}>HORA</AppText>
        <View style={styles.colonSpacer} />
        <AppText style={[styles.columnLabel, { color: theme.muted }]}>MIN</AppText>
      </View>

      <View style={styles.wheelsRow}>
        <WheelColumn
          itemCount={24}
          selected={hours}
          onSelect={handleHoursChange}
          testID="hours-wheel"
        />

        <View style={styles.colonContainer}>
          <AppText style={[styles.colonText, { color: theme.primary }]}>:</AppText>
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
    
    lineHeight: 30,
  },
});
