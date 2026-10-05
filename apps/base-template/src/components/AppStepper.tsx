import type { StepperProps } from 'alambre';
import { Stepper } from 'alambre';
import { View, Text, StyleSheet } from 'react-native';
import { useLightDark } from '../providers/theme';

export type AppStepperProps = StepperProps & {
  label: string;
  unit?: string;
};

export default function AppStepper({
  label,
  unit = '',
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: AppStepperProps) {
  const { theme } = useLightDark();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.color }]}>{label}</Text>
      <Stepper.Root
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        disabled={disabled}
      >
        <View style={styles.controlRow}>
          <Stepper.Decrement
            style={(state) => [
              styles.btn,
              {
                borderColor: theme.border,
                backgroundColor: theme.surfaceAlt,
                opacity: state.canDecrement && !state.disabled ? 1 : 0.4,
              },
            ]}
            accessibilityLabel={`Decrement ${label}`}
          >
            <Text style={[styles.btnText, { color: theme.color }]}>-</Text>
          </Stepper.Decrement>

          <View
            style={[
              styles.valueBox,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <Stepper.Value
              format={(val) => `${val}${unit}`}
              style={[styles.valueText, { color: theme.primary }]}
            />
          </View>

          <Stepper.Increment
            style={(state) => [
              styles.btn,
              {
                borderColor: theme.border,
                backgroundColor: theme.surfaceAlt,
                opacity: state.canIncrement && !state.disabled ? 1 : 0.4,
              },
            ]}
            accessibilityLabel={`Increment ${label}`}
          >
            <Text style={[styles.btnText, { color: theme.color }]}>+</Text>
          </Stepper.Increment>
        </View>
      </Stepper.Root>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  valueBox: {
    minWidth: 70,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
    top: -1,
  },
});
