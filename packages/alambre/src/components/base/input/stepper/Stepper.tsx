import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useStepper } from './use-stepper';
import type { StepperOptions, StepperState } from './use-stepper';

export type StepperProps = Omit<ViewProps, 'style' | 'children'> &
  StepperOptions & {
    style?: StyleProp<ViewStyle> | ((state: StepperState) => StyleProp<ViewStyle>);
    children?: ReactNode | ((state: StepperState) => ReactNode);
  };

export default function Stepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  style,
  children,
  accessibilityRole = 'spinbutton',
  accessibilityValue,
  accessibilityState,
  ...props
}: StepperProps) {
  const stepperState = useStepper({ value, min, max, step, onChange, disabled });

  return (
    <View
      {...props}
      accessibilityRole={accessibilityRole}
      accessibilityValue={{
        min,
        max,
        now: value,
        ...accessibilityValue,
      }}
      accessibilityState={{
        disabled,
        ...accessibilityState,
      }}
      style={typeof style === 'function' ? style(stepperState) : style}
    >
      {typeof children === 'function' ? children(stepperState) : children}
    </View>
  );
}
