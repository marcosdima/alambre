export type ConfigState<T extends Record<string, string>> = {
  config: T;
};

export type UseConfigType<T extends Record<string, string>> = {
  config: T;
  saveField: (field: keyof T, value: string) => Promise<void>;
};
