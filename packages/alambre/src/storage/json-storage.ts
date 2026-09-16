import type { Storage } from '../types/actions';

export const getJson = async <T>(storage: Storage, key: string): Promise<T | null> => {
  const raw = await storage.get(key);
  if (raw === null || raw === undefined) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setJson = async <T>(storage: Storage, key: string, value: T): Promise<void> => {
  await storage.set(key, JSON.stringify(value));
};

export const removeJson = async (storage: Storage, key: string): Promise<void> => {
  if (!storage.remove) return;
  await storage.remove(key);
};

export const readCollection = async <T>(storage: Storage, key: string): Promise<T[]> => (
  (await getJson<T[]>(storage, key)) ?? []
);

export const writeCollection = async <T>(
  storage: Storage,
  key: string,
  items: T[],
): Promise<void> => {
  await setJson(storage, key, items);
};
