export type RawStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export type JsonStorage = {
  getJson: <T>(key: string) => Promise<T | null>;
  setJson: <T>(key: string, value: T) => Promise<void>;
  removeJson: (key: string) => Promise<void>;
};
