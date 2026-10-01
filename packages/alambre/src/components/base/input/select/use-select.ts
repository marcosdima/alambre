export type SelectOption<T = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export type SelectOptions<T = string> = {
  value: T;
  options: SelectOption<T>[];
  disabled?: boolean;
  onChange?: (value: T) => void;
};

export type SelectState<T = string> = {
  value: T;
  options: SelectOption<T>[];
  disabled: boolean;
  selectedIndex: number;
  isSelected: (val: T) => boolean;
  select: (val: T) => void;
  selectIndex: (index: number) => void;
};

export function useSelect<T = string>({
  value,
  options,
  disabled = false,
  onChange,
}: SelectOptions<T>): SelectState<T> {
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  const isSelected = (val: T) => val === value;

  const select = (val: T) => {
    if (disabled) {
      return;
    }
    const option = options.find((opt) => opt.value === val);
    if (option?.disabled) {
      return;
    }
    onChange?.(val);
  };

  const selectIndex = (index: number) => {
    if (disabled || index < 0 || index >= options.length) {
      return;
    }
    const option = options[index];
    if (option && !option.disabled) {
      onChange?.(option.value);
    }
  };

  return {
    value,
    options,
    disabled,
    selectedIndex,
    isSelected,
    select,
    selectIndex,
  };
}
