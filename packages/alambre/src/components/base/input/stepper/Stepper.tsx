import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { StyleProp, ViewProps, ViewStyle, TextProps, TextStyle } from 'react-native';
import { View, Text } from 'react-native';
import { useStepper } from './use-stepper';
import type { StepperOptions, StepperState } from './use-stepper';

const StepperContext = createContext<StepperState | null>(null);

function useStepperContext() {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error('Stepper compound components cannot be rendered outside the Stepper.Root component');
  }
  return context;
}

export type StepperRootProps = Omit<ViewProps, 'style' | 'children'> &
  StepperOptions & {
    style?: StyleProp<ViewStyle> | ((state: StepperState) => StyleProp<ViewStyle>);
    children?: ReactNode | ((state: StepperState) => ReactNode);
  };

const Root = ({
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
}: StepperRootProps) => {
  const stepperState = useStepper({ value, min, max, step, onChange, disabled });

  return (
    <StepperContext.Provider value={stepperState}>
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
    </StepperContext.Provider>
  );
};

export type StepperButtonProps = Omit<ViewProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: StepperState) => StyleProp<ViewStyle>);
};

const Decrement = ({ style, ...props }: StepperButtonProps) => {
  const state = useStepperContext();
  return (
    <View
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: !state.canDecrement || state.disabled }}
      onTouchEnd={() => {
        if (state.canDecrement && !state.disabled) state.decrement();
      }}
      style={typeof style === 'function' ? style(state) : style}
    />
  );
};

const Increment = ({ style, ...props }: StepperButtonProps) => {
  const state = useStepperContext();
  return (
    <View
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: !state.canIncrement || state.disabled }}
      onTouchEnd={() => {
        if (state.canIncrement && !state.disabled) state.increment();
      }}
      style={typeof style === 'function' ? style(state) : style}
    />
  );
};

export type StepperValueProps = Omit<TextProps, 'style'> & {
  format?: (value: number) => string;
  style?: StyleProp<TextStyle> | ((state: StepperState) => StyleProp<TextStyle>);
};

const Value = ({ style, format, ...props }: StepperValueProps) => {
  const state = useStepperContext();
  const displayValue = format ? format(state.value) : String(state.value);
  return (
    <Text {...props} style={typeof style === 'function' ? style(state) : style}>
      {displayValue}
    </Text>
  );
};

export const Stepper = Object.assign(Root, { Root, Decrement, Increment, Value });
export default Stepper;
