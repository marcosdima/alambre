import { getJson, setJson } from './json-storage';
import type { RawStorage } from './types';

export const readCollection = async <T>(
  storage: RawStorage,
  key: string,
): Promise<T[]> => (await getJson<T[]>(storage, key)) ?? [];

export const writeCollection = async <T>(
  storage: RawStorage,
  key: string,
  items: T[],
): Promise<void> => {
  await setJson(storage, key, items);
};
