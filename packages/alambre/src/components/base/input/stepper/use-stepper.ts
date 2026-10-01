export type StepperOptions = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
};

export type StepperState = {
  value: number;
  canIncrement: boolean;
  canDecrement: boolean;
  increment: () => void;
  decrement: () => void;
  setValue: (value: number) => void;
  disabled: boolean;
};

function getPrecision(step: number): number {
  const stepStr = step.toString();
  const decimalIndex = stepStr.indexOf('.');
  return decimalIndex === -1 ? 0 : stepStr.length - decimalIndex - 1;
}

function roundToPrecision(val: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(val * factor) / factor;
}

export function useStepper({
  value,
  min,
  max,
  step = 1,
  disabled = false,
  onChange,
}: StepperOptions): StepperState {
  const precision = getPrecision(step);

  const canIncrement =
    !disabled && (max === undefined || value + step <= max + 1e-9);

  const canDecrement =
    !disabled && (min === undefined || value - step >= min - 1e-9);

  const increment = () => {
    if (!canIncrement) {
      return;
    }
    const next = roundToPrecision(value + step, precision);
    const clamped = max !== undefined ? Math.min(max, next) : next;
    onChange?.(clamped);
  };

  const decrement = () => {
    if (!canDecrement) {
      return;
    }
    const next = roundToPrecision(value - step, precision);
    const clamped = min !== undefined ? Math.max(min, next) : next;
    onChange?.(clamped);
  };

  const setValue = (newValue: number) => {
    if (disabled) {
      return;
    }
    let clamped = newValue;
    if (min !== undefined && clamped < min) {
      clamped = min;
    }
    if (max !== undefined && clamped > max) {
      clamped = max;
    }
    onChange?.(roundToPrecision(clamped, precision));
  };

  return {
    value,
    canIncrement,
    canDecrement,
    increment,
    decrement,
    setValue,
    disabled,
  };
}
