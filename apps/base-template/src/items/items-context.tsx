import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { asyncStorageRaw } from '../storage/async';
import { readCollection, writeCollection } from '../storage/collection';
import {
  addItem as modelAdd,
  removeItem as modelRemove,
  updateItem as modelUpdate,
} from './items-model';
import type { Item, ItemInput } from './item-types';

const ITEMS_KEY = 'colguetti.items';

type ItemsContextValue = {
  items: Item[];
  loading: boolean;
  addItem: (input: ItemInput) => Promise<void>;
  updateItem: (id: string, patch: Partial<ItemInput>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
};

const ItemsContext = createContext<ItemsContextValue | undefined>(undefined);

const persist = (items: Item[]) => writeCollection(asyncStorageRaw, ITEMS_KEY, items);

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void readCollection<Item>(asyncStorageRaw, ITEMS_KEY).then((stored) => {
      if (!mounted) return;
      setItems(stored);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const addItem = useCallback(async (input: ItemInput) => {
    const next = modelAdd(items, input);
    setItems(next);
    await persist(next);
  }, [items]);

  const updateItem = useCallback(async (id: string, patch: Partial<ItemInput>) => {
    const next = modelUpdate(items, id, patch);
    setItems(next);
    await persist(next);
  }, [items]);

  const removeItem = useCallback(async (id: string) => {
    const next = modelRemove(items, id);
    setItems(next);
    await persist(next);
  }, [items]);

  const value = useMemo(
    () => ({ items, loading, addItem, updateItem, removeItem }),
    [items, loading, addItem, updateItem, removeItem],
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
};

export const useItems = (): ItemsContextValue => {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error('useItems must be used within ItemsProvider');
  return ctx;
};
