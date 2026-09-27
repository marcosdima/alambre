import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { storage } from '../storage';
import { createItemId } from './items-model';
import type { Item, ItemInput } from './item-types';

const STORAGE_KEY = 'colguetti.items';

type UseItemsReturn = {
  items: Item[];
  loading: boolean;
  addItem: (input: ItemInput) => Promise<void>;
  updateItem: (id: string, patch: Partial<ItemInput>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  reorderItems: (ordered: Item[]) => Promise<void>;
};

const ItemsContext = createContext<UseItemsReturn | null>(null);

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const raw = await storage.get(STORAGE_KEY);
        if (mounted && raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setItems(parsed);
        }
      } catch {
        // ignore parse error
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: Item[]) => {
    setItems(next);
    await storage.set(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addItem = useCallback(async (input: ItemInput) => {
    const newItem: Item = { ...input, id: createItemId() };
    setItems((prev) => {
      const next = [...prev, newItem];
      void storage.set(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateItem = useCallback(async (id: string, patch: Partial<ItemInput>) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      void storage.set(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback(async (id: string) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      void storage.set(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const reorderItems = useCallback(async (ordered: Item[]) => {
    await persist(ordered);
  }, [persist]);

  const value = useMemo(
    () => ({
      items,
      loading,
      addItem,
      updateItem,
      removeItem,
      reorderItems,
    }),
    [items, loading, addItem, updateItem, removeItem, reorderItems],
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
};

export const useItems = (): UseItemsReturn => {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItems must be used within ItemsProvider');
  }
  return context;
};
