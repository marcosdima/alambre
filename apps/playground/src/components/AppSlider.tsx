import type { SliderProps } from 'alambre';
import { Slider } from 'alambre';
import { View, Text, StyleSheet } from 'react-native';
import { useLightDark } from '../providers/theme';

export type AppSliderProps = SliderProps & {
  label: string;
  unit?: string;
};

export default function AppSlider({
  label,
  unit = '',
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled,
}: AppSliderProps) {
  const { theme } = useLightDark();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.color }]}>{label}</Text>
        <View
          style={[
            styles.valueBadge,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.valueText, { color: theme.primary }]}>
            {value}
            {unit}
          </Text>
        </View>
      </View>

      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        disabled={disabled}
        style={styles.touchArea}
      >
        {({ percentage, disabled: isDisabled }) => (
          <View
            pointerEvents="none"
            style={[
              styles.track,
              {
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
                opacity: isDisabled ? 0.4 : 1,
              },
            ]}
          >
            {/* Active filled progress */}
            <View
              pointerEvents="none"
              style={[
                styles.fill,
                {
                  width: `${percentage}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
            {/* Draggable thumb */}
            <View
              pointerEvents="none"
              style={[
                styles.thumb,
                {
                  left: `${percentage}%`,
                  backgroundColor: theme.primary,
                  borderColor: theme.surface,
                },
              ]}
            />
          </View>
        )}
      </Slider>
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
  touchArea: {
    paddingVertical: 12,
    justifyContent: 'center',
  },
  track: {
    height: 10,
    borderRadius: 6,
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  thumb: {
    position: 'absolute',
    top: -7,
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
});
