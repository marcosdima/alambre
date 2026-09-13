import { describe, expect, it } from 'vitest';
import { createJsonStorage, getJson, setJson, removeJson } from '../src/storage/json-storage';
import type { RawStorage } from '../src/storage/types';

const createMemoryStorage = (): RawStorage => {
  const store = new Map<string, string>();
  return {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => void store.set(key, value),
    removeItem: async (key) => void store.delete(key),
  };
};

describe('json-storage', () => {
  it('round-trips JSON values', async () => {
    const raw = createMemoryStorage();
    const storage = createJsonStorage(raw);

    await setJson(raw, 'todos', [{ id: '1', done: false }]);
    expect(await getJson<Array<{ id: string; done: boolean }>>(raw, 'todos')).toEqual([
      { id: '1', done: false },
    ]);
    expect(storage.getJson('todos')).resolves.toEqual([{ id: '1', done: false }]);
  });

  it('returns null for missing keys', async () => {
    const raw = createMemoryStorage();
    expect(await getJson(raw, 'missing')).toBeNull();
  });

  it('removes keys', async () => {
    const raw = createMemoryStorage();
    await setJson(raw, 'flag', true);
    await removeJson(raw, 'flag');
    expect(await getJson(raw, 'flag')).toBeNull();
  });
});
