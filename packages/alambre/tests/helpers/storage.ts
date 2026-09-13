import type { Storage } from '../../src/types/actions';

export type StorageMock = Storage & {
  data: Record<string, string>;
  getCalls: string[];
  setCalls: Array<[string, string]>;
};

export const createMemoryStorage = (initial: Record<string, string> = {}): StorageMock => {
  const data: Record<string, string> = { ...initial };
  const getCalls: string[] = [];
  const setCalls: Array<[string, string]> = [];

  return {
    data,
    getCalls,
    setCalls,
    get: async (key) => {
      getCalls.push(key);
      return data[key] ?? null;
    },
    set: async (key, value) => {
      setCalls.push([key, value]);
      data[key] = value;
    },
  };
};
