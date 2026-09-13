import type { JsonStorage, RawStorage } from './types';

export const getJson = async <T>(storage: RawStorage, key: string): Promise<T | null> => {
  const raw = await storage.getItem(key);
  if (raw === null || raw === undefined) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setJson = async <T>(storage: RawStorage, key: string, value: T): Promise<void> => {
  await storage.setItem(key, JSON.stringify(value));
};

export const removeJson = async (storage: RawStorage, key: string): Promise<void> => {
  await storage.removeItem(key);
};

export const createJsonStorage = (raw: RawStorage): JsonStorage => ({
  getJson: <T,>(key: string) => getJson<T>(raw, key),
  setJson: <T,>(key: string, value: T) => setJson(raw, key, value),
  removeJson: (key: string) => removeJson(raw, key),
});
