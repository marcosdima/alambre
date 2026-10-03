import React from 'react';
import AppSlider from '../AppSlider';

export interface ConfigSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
}

export function ConfigSlider({ label, value, min = 0, max = 100, step = 1, onChange }: ConfigSliderProps) {
  return (
    <AppSlider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
    />
  );
}
