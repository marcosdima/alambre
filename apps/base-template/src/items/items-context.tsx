import { useMemo, type ReactNode } from 'react';
import { createCollectionProvider, type UseCollectionType } from 'alambre';
import { asyncStorageRaw } from '../storage/async';
import { toAlambreStorage } from '../storage/alambre-storage';
import { createItemId } from './items-model';
import type { Item, ItemInput } from './item-types';

const { Provider: ItemsCollectionProvider, useValue } = createCollectionProvider<Item>({
  storage: toAlambreStorage(asyncStorageRaw),
  storageKey: 'colguetti.items',
  hookName: 'Items',
});

type UseItemsReturn = {
  items: Item[];
  loading: boolean;
  addItem: (input: ItemInput) => Promise<void>;
  updateItem: (id: string, patch: Partial<ItemInput>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
};

export const ItemsProvider = ({ children }: { children: ReactNode }) => (
  <ItemsCollectionProvider>{children}</ItemsCollectionProvider>
);

export const useItems = (): UseItemsReturn => {
  const value = useValue() as unknown as UseCollectionType<Item>;

  return useMemo(
    () => ({
      items: value.records,
      loading: value.loading,
      addItem: (input) => value.add({ ...input, id: createItemId() }),
      updateItem: value.update,
      removeItem: value.remove,
    }),
    [value],
  );
};
