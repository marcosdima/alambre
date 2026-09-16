import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { HOUR_RANGE, MINUTE_RANGE, parseTimeValue, formatTimeValue } from './time-utils';

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
const ARROW_HEIGHT = 26;

type WheelProps = {
  data: readonly string[];
  testID?: string;
  accentColor: ColorValue;
  itemHeight: number;
  visibleCount: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const wrapIndex = (index: number, length: number): number => {
  const wrapped = index % length;
  return wrapped < 0 ? wrapped + length : wrapped;
};

const Wheel = ({
  data,
  accentColor,
  itemHeight,
  visibleCount,
  selectedIndex,
  onSelect,
  testID: prefix,
}: WheelProps) => {
  const center = Math.floor(visibleCount / 2);
  const stripHeight = itemHeight * visibleCount;
  const visible = Array.from({ length: visibleCount }, (_, offset) =>
    wrapIndex(selectedIndex - center + offset, data.length),
  );

  return (
    <View
      style={[styles.wheel, { height: stripHeight + ARROW_HEIGHT * 2 }]}
      testID={prefix ? `${prefix}-wheel` : undefined}
    >
      <Pressable
        onPress={() => onSelect(wrapIndex(selectedIndex - 1, data.length))}
        hitSlop={8}
        style={({ pressed }) => [
          styles.arrow,
          { height: ARROW_HEIGHT },
          pressed && styles.arrowPressed,
        ]}
        testID={prefix ? `${prefix}-up` : undefined}
      >
        <Text style={[styles.arrowLabel, { color: accentColor }]}>▲</Text>
      </Pressable>

      <View style={[styles.strip, { height: stripHeight }]}>
        {visible.map((index) => {
          const selected = index === selectedIndex;
          return (
            <Pressable
              key={index}
              onPress={() => onSelect(index)}
              style={({ pressed }) => [
                styles.item,
                { height: itemHeight },
                pressed && styles.itemPressed,
              ]}
              testID={prefix ? `${prefix}-item-${index}` : undefined}
            >
              <Text
                style={[
                  styles.label,
                  selected ? { color: accentColor, fontWeight: '800' } : styles.inactive,
                ]}
              >
                {data[index]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => onSelect(wrapIndex(selectedIndex + 1, data.length))}
        hitSlop={8}
        style={({ pressed }) => [
          styles.arrow,
          { height: ARROW_HEIGHT },
          pressed && styles.arrowPressed,
        ]}
        testID={prefix ? `${prefix}-down` : undefined}
      >
        <Text style={[styles.arrowLabel, { color: accentColor }]}>▼</Text>
      </Pressable>
    </View>
  );
};

export default function TimePicker({
  value,
  onChange,
  accentColor = DEFAULT_ACCENT,
  itemHeight = 34,
  visibleCount = 3,
  style,
  testID,
}: TimePickerProps) {
  const parsed = parseTimeValue(value);
  const [parts, setParts] = useState(parsed);
  const lastValueRef = useRef(value);
  const stripHeight = itemHeight * visibleCount;
  const rowHeight = stripHeight + ARROW_HEIGHT * 2;

  useEffect(() => {
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;
    setParts(parseTimeValue(value));
  }, [value]);

  const emit = (hours: number, minutes: number) => {
    const next = formatTimeValue({ hours, minutes });
    lastValueRef.current = next;
    onChange(next);
  };

  const selectHour = (index: number) => {
    if (index === parts.hours) return;
    emit(index, parts.minutes);
    setParts({ hours: index, minutes: parts.minutes });
  };

  const selectMinute = (index: number) => {
    if (index === parts.minutes) return;
    emit(parts.hours, index);
    setParts({ hours: parts.hours, minutes: index });
  };

  return (
    <View style={[styles.row, { height: rowHeight }, style]} testID={testID}>
      <View
        style={[
          styles.highlight,
          { top: ARROW_HEIGHT + (stripHeight - itemHeight) / 2 },
          { height: itemHeight },
        ]}
      >
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
        visibleCount={visibleCount}
        selectedIndex={parts.hours}
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
        visibleCount={visibleCount}
        selectedIndex={parts.minutes}
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
  arrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowPressed: {
    opacity: 0.6,
  },
  arrowLabel: {
    fontSize: 12,
  },
  strip: {
    justifyContent: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressed: {
    opacity: 0.8,
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
  },
  highlightFill: {
    borderWidth: 1,
    borderRadius: 12,
  },
  highlightTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderRadius: 11,
  },
});
