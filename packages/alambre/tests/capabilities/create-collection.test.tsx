import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import createCollection from '../../src/capabilities/collection/create-collection';
import type { UseCollectionType } from '../../src/capabilities/collection/collection-types';
import { createMemoryStorage } from '../helpers/storage';

type Item = { id: string; name: string };
type ItemValue = UseCollectionType<Item>;

const items: Item[] = [
  { id: 'a', name: 'keys' },
  { id: 'b', name: 'wallet' },
];

describe('createCollection', () => {
  it('hydrates records persisted as JSON and reports loading', async () => {
    const storage = createMemoryStorage({ items: JSON.stringify(items) });
    const { useCollection } = createCollection<Item>({
      storage,
      storageKey: 'items',
    });

    const holder: { current?: ItemValue } = {};
    const Consumer = () => {
      holder.current = useCollection();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.records).toEqual(items));
    expect(holder.current?.loading).toBe(false);
  });

  it('falls back to the initial value when nothing is persisted', async () => {
    const storage = createMemoryStorage();
    const { useCollection } = createCollection<Item>({
      storage,
      storageKey: 'items',
      initialValue: [],
    });

    const holder: { current?: ItemValue } = {};
    const Consumer = () => {
      holder.current = useCollection();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.records).toEqual([]));
  });

  it('recovers the initial value when the stored payload is corrupt', async () => {
    const storage = createMemoryStorage({ items: '{nope' });
    const { useCollection } = createCollection<Item>({
      storage,
      storageKey: 'items',
      initialValue: [],
    });

    const holder: { current?: ItemValue } = {};
    const Consumer = () => {
      holder.current = useCollection();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.records).toEqual([]));
  });

  it('adds, updates and removes records through the storage adapter', async () => {
    const storage = createMemoryStorage();
    const { useCollection } = createCollection<Item>({
      storage,
      storageKey: 'items',
    });

    const holder: { current?: ItemValue } = {};
    const Consumer = () => {
      holder.current = useCollection();
      return null;
    };

    render(<Consumer />);
    await waitFor(() => expect(holder.current).toBeDefined());

    await act(async () => {
      await holder.current!.add({ id: 'c', name: 'phone' });
    });
    await waitFor(() => expect(holder.current?.records).toEqual([{ id: 'c', name: 'phone' }]));
    expect(JSON.parse(storage.data.items)).toEqual([{ id: 'c', name: 'phone' }]);

    await act(async () => {
      await holder.current!.update('c', { name: 'phone-v2' });
    });
    await waitFor(() => expect(holder.current?.records[0].name).toBe('phone-v2'));

    await act(async () => {
      await holder.current!.remove('c');
    });
    await waitFor(() => expect(holder.current?.records).toEqual([]));
  });

  it('can be accessed directly via actions and store without React render', async () => {
    const storage = createMemoryStorage();
    const { store, actions } = createCollection<Item>({
      storage,
      storageKey: 'items',
    });

    await waitFor(() => expect(store.getState().loading).toBe(false));

    await actions.add({ id: 'x', name: 'watch' });

    expect(store.getState().records).toEqual([{ id: 'x', name: 'watch' }]);
    expect(JSON.parse(storage.data.items)).toEqual([{ id: 'x', name: 'watch' }]);

    await actions.update('x', { name: 'watch-v2' });
    expect(store.getState().records[0].name).toBe('watch-v2');

    await actions.remove('x');
    expect(store.getState().records).toEqual([]);
  });
});
