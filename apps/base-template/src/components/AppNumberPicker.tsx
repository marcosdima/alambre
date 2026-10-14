import type { ComponentProps } from 'react';
import { HorizontalPicker } from 'alambre';
import { View, Text, StyleSheet } from 'react-native';
import { useLightDark } from '../providers/theme';

export type AppNumberPickerProps = ComponentProps<typeof HorizontalPicker.Root> & {
  label?: string;
  unit?: string;
};

export default function AppNumberPicker({
  label,
  unit = '',
  itemCount,
  selected,
  onSelect,
  itemWidth = 60,
  visibleItems = 5,
  cycles,
  style,
  ...props
}: AppNumberPickerProps) {
  const { theme } = useLightDark();

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.header}>
          <Text style={[styles.label, { color: theme.color }]}>{label}</Text>
          <View
            style={[
              styles.valueBadge,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.valueText, { color: theme.primary }]}>
              {selected}
              {unit}
            </Text>
          </View>
        </View>
      )}

      <HorizontalPicker.Root
        itemCount={itemCount}
        selected={selected}
        onSelect={onSelect}
        itemWidth={itemWidth}
        visibleItems={visibleItems}
        cycles={cycles}
        style={(state) => [styles.pickerArea, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }, typeof style === 'function' ? style(state) : style]}
        {...props}
      >
        <HorizontalPicker.Track>
          {(item: number, index: number, isSelected: boolean) => (
            <Text
              style={[
                styles.itemText,
                { color: isSelected ? theme.primary : theme.muted },
                isSelected && styles.itemTextSelected,
              ]}
            >
              {item}
            </Text>
          )}
        </HorizontalPicker.Track>
      </HorizontalPicker.Root>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  valueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pickerArea: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: 'center',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemTextSelected: {
    fontSize: 20,
    fontWeight: '700',
  },
});
