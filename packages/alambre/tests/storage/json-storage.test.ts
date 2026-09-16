import { describe, expect, it } from 'vitest';
import { createMemoryStorage, type StorageMock } from '../helpers/storage';
import { createStorage } from '../../src/storage/create-storage';
import {
  getJson,
  setJson,
  removeJson,
  readCollection,
  writeCollection,
} from '../../src/storage/json-storage';

describe('createStorage', () => {
  it('maps getItem/setItem/removeItem to the Storage shape', async () => {
    const raw = { getItem: async () => 'v', setItem: async () => {}, removeItem: async () => {} };
    const s = createStorage(raw);

    await expect(s.get('k')).resolves.toBe('v');
    await s.set('k', 'v2');
    await s.remove?.('k');
  });

  it('produces undefined remove when raw.removeItem is omitted', () => {
    const s = createStorage({ getItem: async () => null, setItem: async () => {} });
    expect(s.remove).toBeUndefined();
  });
});

describe('json-storage', () => {
  const setup = (initial: Record<string, string> = {}): StorageMock => createMemoryStorage(initial);

  it('getJson returns null on missing key', async () => {
    const s = setup();
    await expect(getJson<string>(s, 'nope')).resolves.toBeNull();
  });

  it('getJson parses a stored JSON value', async () => {
    const s = setup({ 'arr': JSON.stringify([1, 2]) });
    await expect(getJson<number[]>(s, 'arr')).resolves.toEqual([1, 2]);
  });

  it('getJson returns null on invalid JSON', async () => {
    const s = setup({ 'bad': '{bad' });
    await expect(getJson(s, 'bad')).resolves.toBeNull();
  });

  it('setJson writes and getJson reads back', async () => {
    const s = setup();
    await setJson(s, 'cfg', { a: 1 });
    await expect(getJson(s, 'cfg')).resolves.toEqual({ a: 1 });
    expect(s.data['cfg']).toBe('{"a":1}');
  });

  it('removeJson calls storage.remove', async () => {
    const s = setup({ 'x': '1' });
    await removeJson(s, 'x');
    expect(s.data['x']).toBeUndefined();
  });

  it('removeJson is a no-op when remove is absent', async () => {
    const s = createMemoryStorage({ 'x': '1' });
    delete (s as { remove?: typeof s.remove }).remove;
    await removeJson(s, 'x');
  });

  it('readCollection returns [] on missing key', async () => {
    const s = setup();
    await expect(readCollection(s, 'items')).resolves.toEqual([]);
  });

  it('readCollection returns the stored array', async () => {
    const s = setup({ 'items': JSON.stringify([{ id: '1' }]) });
    await expect(readCollection(s, 'items')).resolves.toEqual([{ id: '1' }]);
  });

  it('readCollection returns [] on invalid JSON', async () => {
    const s = setup({ 'items': 'bad' });
    await expect(readCollection(s, 'items')).resolves.toEqual([]);
  });

  it('writeCollection round-trips via readCollection', async () => {
    const s = setup();
    const data = [{ id: 'a' }, { id: 'b' }];
    await writeCollection(s, 'items', data);
    await expect(readCollection(s, 'items')).resolves.toEqual(data);
  });
});
