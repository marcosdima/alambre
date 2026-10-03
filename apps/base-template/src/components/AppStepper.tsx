import type { StepperProps } from 'alambre';
import { Stepper } from 'alambre';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useContinuousPress } from 'alambre';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useLightDark } from '../providers/theme';
import { kinetics } from 'alambre';

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
        {(state) => (
          <View style={styles.controlRow}>
            <ContinuousPressable
              onPress={() => {
                if (state.canDecrement && !state.disabled) state.decrement();
              }}
              style={[
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
            </ContinuousPressable>

            <View
              style={[
                styles.valueBox,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
            >
              <RollingNumber
                value={state.value}
                format={(val) => `${val}${unit}`}
                style={[styles.valueText, { color: theme.primary }]}
              />
            </View>

            <ContinuousPressable
              onPress={() => {
                if (state.canIncrement && !state.disabled) state.increment();
              }}
              style={[
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
            </ContinuousPressable>
          </View>
        )}
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
  },
});


function RollingNumber({ value, format, style }: { value: number; format: (v: number) => string; style?: any }) {
  const previous = useSharedValue(value);
  const current = useSharedValue(value);
  const translateY = useSharedValue(0);
  const textOpacity = useSharedValue(1);

  useEffect(() => {
    if (current.value !== value) {
      previous.value = current.value;
      current.value = value;
      const direction = value > previous.value ? -1 : 1;
      
      translateY.value = direction * 20;
      textOpacity.value = 0;
      
      translateY.value = withSpring(0, kinetics.spring.bouncy);
      textOpacity.value = withTiming(1, kinetics.timing.fast);
    }
  }, [value, current, previous, translateY, textOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: textOpacity.value,
  }));

  return (
    <View style={{ overflow: 'hidden', height: 24, justifyContent: 'center' }}>
      <Animated.Text style={[style, animatedStyle]}>{format(value)}</Animated.Text>
    </View>
  );
}


function ContinuousPressable({ onPress, children, style, ...props }: { onPress: () => void; children: any; style?: any; [key: string]: any }) {
  const handlers = useContinuousPress({
    onPress,
    delay: 400,
    interval: 100,
    intervalMultiplier: 0.9,
  });

  return (
    <Pressable {...handlers} style={style} {...props}>
      {children}
    </Pressable>
  );
}
