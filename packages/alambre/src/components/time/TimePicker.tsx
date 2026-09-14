import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ColorValue, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import {
  HOUR_RANGE,
  MINUTE_RANGE,
  clampIndex,
  formatTimeValue,
  indexFromOffset,
  parseTimeValue,
} from './time-utils';

export type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  accentColor?: ColorValue;
  itemHeight?: number;
  visibleCount?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const DEFAULT_ACCENT = '#0057d8';

type WheelProps = {
  data: readonly string[];
  testID?: string;
  accentColor: ColorValue;
  itemHeight: number;
  containerHeight: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const Wheel = ({
  data,
  accentColor,
  itemHeight,
  containerHeight,
  selectedIndex,
  onSelect,
  testID: prefix,
}: WheelProps) => {
  const scrollRef = useRef<ScrollView>(null);
  const layoutRef = useRef(0);
  const [ready, setReady] = useState(false);

  const padding = (containerHeight - itemHeight) / 2;

  const snapToOffsets = useMemo(
    () => data.map((_, index) => padding + index * itemHeight),
    [data, padding, itemHeight],
  );

  const scrollToIndex = (index: number) => {
    scrollRef.current?.scrollTo({ y: padding + index * itemHeight, animated: false });
  };

  useLayoutEffect(() => {
    if (!ready) return;
    scrollToIndex(selectedIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const onLayout = (event: LayoutChangeEvent) => {
    const y = event?.nativeEvent?.layout?.y;
    if (typeof y !== 'number') return;
    layoutRef.current = y;
    setReady(true);
  };

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = clampIndex(
      indexFromOffset(event.nativeEvent.contentOffset.y, itemHeight, padding),
      data.length,
    );
    onSelect(index);
  };

  return (
    <View
      style={[styles.wheel, { height: containerHeight }]}
      onLayout={onLayout}
      testID={prefix ? `${prefix}-wheel` : undefined}
    >
      <ScrollView
        ref={scrollRef}
        snapToOffsets={snapToOffsets}
        decelerationRate="fast"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        contentContainerStyle={{ paddingVertical: padding }}
        style={styles.scroll}
        testID={prefix ? `${prefix}-scroll` : undefined}
      >
        {data.map((label, index) => {
          const selected = index === selectedIndex;
          return (
            <View
              key={label}
              style={[styles.item, { height: itemHeight }]}
            >
              <Text
                style={[
                  styles.label,
                  selected
                    ? { color: accentColor, fontWeight: '800' }
                    : styles.inactive,
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default function TimePicker({
  value,
  onChange,
  accentColor = DEFAULT_ACCENT,
  itemHeight = 34,
  visibleCount = 5,
  style,
  testID,
}: TimePickerProps) {
  const parsed = parseTimeValue(value);
  const containerHeight = itemHeight * visibleCount;

  const [hourIndex, setHourIndex] = useState(parsed.hours);
  const [minuteIndex, setMinuteIndex] = useState(parsed.minutes);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (value === lastValueRef.current) return;
    const next = parseTimeValue(value);
    setHourIndex(next.hours);
    setMinuteIndex(next.minutes);
  }, [value]);

  const emit = useCallback(
    (hours: number, minutes: number) => {
      const next = formatTimeValue({ hours, minutes });
      lastValueRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const selectHour = (index: number) => {
    setHourIndex(index);
    emit(index, minuteIndex);
  };

  const selectMinute = (index: number) => {
    setMinuteIndex(index);
    emit(hourIndex, index);
  };

  return (
    <View style={[styles.row, { height: containerHeight }, style]} testID={testID}>
      <View style={[styles.highlight, { top: (containerHeight - itemHeight) / 2 }]}>
        <View
          style={[
            styles.highlightFill,
            { height: itemHeight, borderColor: accentColor },
          ]}
        >
          <View
            style={[styles.highlightTint, { backgroundColor: accentColor }]}
            pointerEvents="none"
          />
        </View>
      </View>

      <Wheel
        data={HOUR_RANGE}
        accentColor={accentColor}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        selectedIndex={hourIndex}
        onSelect={selectHour}
        testID={testID ? `${testID}-hour` : undefined}
      />

      <View style={styles.separator}>
        <Text style={[styles.separatorText, { color: accentColor }]}>:</Text>
      </View>

      <Wheel
        data={MINUTE_RANGE}
        accentColor={accentColor}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        selectedIndex={minuteIndex}
        onSelect={selectMinute}
        testID={testID ? `${testID}-minute` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  wheel: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 20,
  },
  inactive: {
    color: '#9aa3b2',
    fontWeight: '400',
  },
  separator: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorText: {
    fontSize: 24,
    fontWeight: '800',
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 0,
    justifyContent: 'center',
  },
  highlightFill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
  },
  highlightTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderRadius: 11,
  },
});
