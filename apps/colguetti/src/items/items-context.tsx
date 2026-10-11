import { createCollection } from 'alambre';
import { storage } from '../storage';
import { createItemId } from './items-model';
import type { Item, ItemInput } from './item-types';

const STORAGE_KEY = 'colguetti.items';

const collection = createCollection<Item>({
  storage,
  storageKey: STORAGE_KEY,
});

export const ItemsProvider = collection.Provider;

export const useItems = () => {
  const { records, loading, add, update, remove, reorder, move } = collection.useCollection();

  const addItem = async (input: ItemInput) => {
    await add({ ...input, id: createItemId() });
  };

  return {
    items: records,
    loading,
    addItem,
    updateItem: update,
    removeItem: remove,
    reorderItems: reorder,
    moveItem: move,
  };
};
