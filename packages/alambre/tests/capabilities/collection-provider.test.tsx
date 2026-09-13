import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import createCollectionProvider from '../../src/capabilities/collection/create-collection-provider';
import type { UseCollectionType } from '../../src/capabilities/collection/collection-types';
import { createMemoryStorage } from '../helpers/storage';

type Item = { id: string; name: string };
type ItemValue = UseCollectionType<Item>;

const items: Item[] = [
  { id: 'a', name: 'keys' },
  { id: 'b', name: 'wallet' },
];

describe('createCollectionProvider', () => {
  it('hydrates records persisted as JSON and reports loading', async () => {
    const storage = createMemoryStorage({ items: JSON.stringify(items) });
    const { Provider, useValue } = createCollectionProvider<Item>({
      storage,
      storageKey: 'items',
      hookName: 'Items',
    });

    const holder: { current?: ItemValue } = {};
    const Consumer = () => {
      holder.current = useValue();
      return null;
    };

    render(<Provider><Consumer /></Provider>);

    await waitFor(() => expect(holder.current?.records).toEqual(items));
    expect(holder.current?.loading).toBe(false);
  });

  it('falls back to the initial value when nothing is persisted', async () => {
    const storage = createMemoryStorage();
    const { Provider, useValue } = createCollectionProvider<Item>({
      storage,
      storageKey: 'items',
      initialValue: [],
    });

    const holder: { current?: ItemValue } = {};
    const Consumer = () => {
      holder.current = useValue();
      return null;
    };

    render(<Provider><Consumer /></Provider>);

    await waitFor(() => expect(holder.current?.records).toEqual([]));
  });

  it('recovers the initial value when the stored payload is corrupt', async () => {
    const storage = createMemoryStorage({ items: '{nope' });
    const { Provider, useValue } = createCollectionProvider<Item>({
      storage,
      storageKey: 'items',
      initialValue: [],
    });

    const holder: { current?: ItemValue } = {};
    const Consumer = () => {
      holder.current = useValue();
      return null;
    };

    render(<Provider><Consumer /></Provider>);

    await waitFor(() => expect(holder.current?.records).toEqual([]));
  });

  it('adds, updates and removes records through the storage adapter', async () => {
    const storage = createMemoryStorage();
    const { Provider, useValue } = createCollectionProvider<Item>({
      storage,
      storageKey: 'items',
    });

    const holder: { current?: ItemValue } = {};
    const Consumer = () => {
      holder.current = useValue();
      return null;
    };

    render(<Provider><Consumer /></Provider>);
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

  it('throws when the hook is used outside the provider', () => {
    const storage = createMemoryStorage();
    const { useValue } = createCollectionProvider<Item>({
      storage,
      storageKey: 'items',
      hookName: 'Items',
    });

    const Consumer = () => {
      useValue();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow(/useItems must be used within ItemsProvider/);
  });
});
