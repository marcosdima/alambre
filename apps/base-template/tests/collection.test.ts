import { describe, expect, it } from 'vitest';
import { readCollection, writeCollection } from '../src/storage/collection';
import type { RawStorage } from '../src/storage/types';

const createFakeStorage = (): RawStorage => {
  const map = new Map<string, string>();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => { map.set(key, value); },
    removeItem: async (key) => { map.delete(key); },
  };
};

describe('collection', () => {
  it('returns an empty array when nothing is stored', async () => {
    const raw = createFakeStorage();
    await expect(readCollection(raw, 'c')).resolves.toEqual([]);
  });

  it('round-trips a stored collection', async () => {
    const raw = createFakeStorage();
    await writeCollection(raw, 'c', [{ id: '1' }, { id: '2' }]);
    await expect(readCollection<{ id: string }>(raw, 'c')).resolves.toEqual([{ id: '1' }, { id: '2' }]);
  });

  it('recovers an empty array for corrupt collections', async () => {
    const raw = createFakeStorage();
    await raw.setItem('c', 'not json');
    await expect(readCollection(raw, 'c')).resolves.toEqual([]);
  });
});
