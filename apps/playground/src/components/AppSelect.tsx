import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLightDark } from '../providers/theme';

export type SelectOptionItem<T = string> = {
  value: T;
  label: string;
  description?: string;
};

export type AppSelectProps<T = string> = {
  label: string;
  value: T;
  options: SelectOptionItem<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

export default function AppSelect<T = string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: AppSelectProps<T>) {
  const { theme } = useLightDark();
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: T) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>

      {/* Trigger Button */}
      <Pressable
        onPress={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: open ? theme.primary : theme.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedOption?.label || ''}`}
      >
        <Text style={[styles.triggerText, { color: theme.color }]}>
          {selectedOption?.label || String(value)}
        </Text>
        <Text style={[styles.arrow, { color: theme.muted }]}>
          {open ? '▲' : '▼'}
        </Text>
      </Pressable>

      {/* Expanded Inline Options */}
      {open && (
        <View
          style={[
            styles.optionsList,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={String(opt.value)}
                onPress={() => handleSelect(opt.value)}
                style={[
                  styles.optionRow,
                  { borderColor: theme.border },
                  isSelected && {
                    backgroundColor: theme.primarySoft,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: isSelected ? theme.primary : theme.color,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {opt.description && (
                    <Text style={[styles.optionDesc, { color: theme.muted }]}>
                      {opt.description}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Text style={[styles.check, { color: theme.primary }]}>✓</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 10,
    marginLeft: 8,
  },
  optionsList: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    gap: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 13,
  },
  optionDesc: {
    fontSize: 11,
  },
  check: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});
