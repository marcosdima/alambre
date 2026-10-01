export type ConfigState<T extends Record<string, unknown>> = {
  config: T;
  loading: boolean;
};

export type UseConfigType<T extends Record<string, unknown>> = {
  config: T;
  loading: boolean;
  saveField: <K extends keyof T>(field: K, value: T[K]) => Promise<void>;
};
