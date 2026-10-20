import { AppSlider } from '@some-alambre/ui';

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
