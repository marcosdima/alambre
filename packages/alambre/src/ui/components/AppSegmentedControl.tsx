import type { SegmentedControlProps } from '../..';
import { SegmentedControl } from '../..';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, resolveTypography } from '../theme';

export type AppSegmentedControlProps<T = string> = SegmentedControlProps<T> & {
  label?: string;
};

export default function AppSegmentedControl<T = string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: AppSegmentedControlProps<T>) {
  const { theme } = useTheme();
  const labelTypography = resolveTypography(theme, { weight: '600' });

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: theme.muted }, labelTypography]}>{label}</Text>}
      <SegmentedControl
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
      >
        {({ options: opts, isSelected, select }) => (
          <View
            style={[
              styles.bar,
              {
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
              },
            ]}
          >
            {opts.map((opt) => {
              const active = isSelected(opt.value);
              return (
                <Pressable
                  key={String(opt.value)}
                  onPress={() => select(opt.value)}
                  disabled={opt.disabled}
                  style={[
                    styles.segment,
                    active && [
                      styles.activeSegment,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.primary,
                      },
                    ],
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: active ? theme.primary : theme.color,
                      },
                      resolveTypography(theme, { weight: active ? '700' : '500' }),
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </SegmentedControl>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 9,
  },
  activeSegment: {
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  segmentText: {
    fontSize: 13,
  },
});
