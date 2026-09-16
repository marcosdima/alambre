import type { Storage } from '../types/actions';

export type RawStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem?: (key: string) => Promise<void>;
};

export const createStorage = (raw: RawStorage): Storage => ({
  get: raw.getItem,
  set: raw.setItem,
  remove: raw.removeItem,
});
