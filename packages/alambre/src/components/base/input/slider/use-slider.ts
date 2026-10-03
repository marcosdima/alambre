import { useState } from 'react';

export type SliderOptions = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
};

export type SliderState = {
  value: number;
  min: number;
  max: number;
  step: number;
  ratio: number;
  percentage: number;
  disabled: boolean;
  isPressed: boolean;
  setIsPressed: (pressed: boolean) => void;
  setValueFromRatio: (ratio: number) => void;
  setValue: (value: number) => void;
  increment: () => void;
  decrement: () => void;
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

export function useSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  onChange,
}: SliderOptions): SliderState {
  const [isPressed, setIsPressed] = useState(false);
  const precision = getPrecision(step);
  const span = max - min;
  const ratio = span > 0 ? Math.max(0, Math.min(1, (value - min) / span)) : 0;
  const percentage = Math.round(ratio * 1000) / 10;

  const setValue = (newValue: number) => {
    if (disabled) {
      return;
    }
    const clamped = Math.max(min, Math.min(max, newValue));
    onChange?.(roundToPrecision(clamped, precision));
  };

  const setValueFromRatio = (newRatio: number) => {
    if (disabled || span <= 0) {
      return;
    }
    const clampedRatio = Math.max(0, Math.min(1, newRatio));
    const rawVal = min + clampedRatio * span;
    const stepsCount = Math.round((rawVal - min) / step);
    const steppedVal = min + stepsCount * step;
    setValue(steppedVal);
  };

  const increment = () => {
    if (disabled) {
      return;
    }
    setValue(value + step);
  };

  const decrement = () => {
    if (disabled) {
      return;
    }
    setValue(value - step);
  };

  return {
    value,
    min,
    max,
    step,
    ratio,
    percentage,
    disabled,
    isPressed,
    setIsPressed,
    setValueFromRatio,
    setValue,
    increment,
    decrement,
  };
}
