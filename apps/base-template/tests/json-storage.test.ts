import { describe, expect, it } from 'vitest';
import { getJson, setJson } from '../src/storage/json-storage';
import { createJsonStorage } from '../src/storage/json-storage';
import type { RawStorage } from '../src/storage/types';

const createFakeStorage = (seed: Record<string, string> = {}): RawStorage => {
  const map = new Map(Object.entries(seed));
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => { map.set(key, value); },
    removeItem: async (key) => { map.delete(key); },
  };
};

describe('json-storage', () => {
  it('round-trips a JSON value', async () => {
    const raw = createFakeStorage();
    await setJson(raw, 'k', { a: 1, b: ['x', 'y'] });
    await expect(getJson<{ a: number; b: string[] }>(raw, 'k')).resolves.toEqual({ a: 1, b: ['x', 'y'] });
  });

  it('returns null for a missing key', async () => {
    const raw = createFakeStorage();
    await expect(getJson(raw, 'missing')).resolves.toBeNull();
  });

  it('returns null for corrupt JSON', async () => {
    const raw = createFakeStorage({ 'bad': '{not json' });
    await expect(getJson(raw, 'bad')).resolves.toBeNull();
  });

  it('stays null after removing the key', async () => {
    const json = createJsonStorage(createFakeStorage());
    await json.setJson('k', { ok: true });
    await json.removeJson('k');
    await expect(json.getJson('k')).resolves.toBeNull();
  });
});
