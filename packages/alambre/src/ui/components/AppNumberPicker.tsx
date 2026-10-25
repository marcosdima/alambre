import type { ComponentProps } from 'react';
import { HorizontalPicker } from '../..';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, resolveTypography } from '../theme';

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
  const { theme } = useTheme();
  const labelTypography = resolveTypography(theme, { weight: '600' });
  const valueTypography = resolveTypography(theme, { weight: '700', mono: true });

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.header}>
          <Text style={[styles.label, { color: theme.color }, labelTypography]}>{label}</Text>
          <View
            style={[
              styles.valueBadge,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.valueText, { color: theme.primary }, valueTypography]}>
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
                resolveTypography(theme, { weight: isSelected ? '700' : '500', mono: true }),
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
  },
  valueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  valueText: {
    fontSize: 12,
  },
  pickerArea: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: 'center',
  },
  itemText: {
    fontSize: 16,
  },
  itemTextSelected: {
    fontSize: 20,
  },
});
