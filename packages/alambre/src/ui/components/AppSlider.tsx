import type { SliderProps } from '../..';
import { Slider } from '../..';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, resolveTypography } from '../theme';

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
  const { theme } = useTheme();
  const labelTypography = resolveTypography(theme, { weight: '600' });
  const valueTypography = resolveTypography(theme, { weight: '700', mono: true });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.color }, labelTypography]}>{label}</Text>
        <View
          style={[
            styles.valueBadge,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.valueText, { color: theme.primary }, valueTypography]}>
            {value}
            {unit}
          </Text>
        </View>
      </View>

      <Slider.Root
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        disabled={disabled}
        style={styles.touchArea}
      >
        <Slider.Track
          pointerEvents="none"
          style={(state) => [
            styles.track,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
              opacity: state.disabled ? 0.4 : 1,
            },
          ]}
        >
          {/* Active filled progress */}
          <Slider.Range
            pointerEvents="none"
            style={(state) => [
              styles.fill,
              {
                width: `${state.percentage}%`,
                backgroundColor: theme.primary,
              },
            ]}
          />
          {/* Draggable thumb */}
          <Slider.Thumb
            pointerEvents="none"
            style={(state) => [
              styles.thumb,
              {
                left: `${state.percentage}%`,
                backgroundColor: theme.primary,
                borderColor: theme.surface,
              },
            ]}
          />
        </Slider.Track>
      </Slider.Root>
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
