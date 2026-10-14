import type { FC, ReactNode, ReactElement } from 'react';
import type { Storage } from '../../types/actions';
import createStore from '../../core/create-store';
import { useExternalStore } from '../../core/use-external-store';
import type { CollectionRecord, CollectionState, UseCollectionType } from './collection-types';

type CollectionOptions<T extends CollectionRecord> = {
  storage: Storage;
  storageKey: string;
  initialValue?: T[];
  hookName?: string;
};

const Provider: FC<{ children?: ReactNode }> = ({ children }) => (children ?? null) as ReactElement | null;

const parseRecords = <T extends CollectionRecord>(raw: string | null, fallback: T[]): T[] => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
};

const createCollection = <T extends CollectionRecord>({
  storage,
  storageKey,
  initialValue = [],
}: CollectionOptions<T>) => {
  const store = createStore<CollectionState<T>>({ records: initialValue, loading: true });

  const persist = (state: CollectionState<T>) => (
    storage.set(storageKey, JSON.stringify(state.records))
  );

  const add = async (record: T) => {
    const prev = store.getState();
    const next: CollectionState<T> = { ...prev, records: [...prev.records, record] };
    store.setState(next);
    await persist(next);
  };

  const update = async (id: string, patch: Partial<T>) => {
    const prev = store.getState();
    const next: CollectionState<T> = {
      ...prev,
      records: prev.records.map((record) => (
        record.id === id ? { ...record, ...patch } : record
      )),
    };
    store.setState(next);
    await persist(next);
  };

  const remove = async (id: string) => {
    const prev = store.getState();
    const next: CollectionState<T> = {
      ...prev,
      records: prev.records.filter((record) => record.id !== id),
    };
    store.setState(next);
    await persist(next);
  };

  const reorder = async (records: T[]) => {
    const prev = store.getState();
    const next: CollectionState<T> = { ...prev, records };
    store.setState(next);
    await persist(next);
  };

  const move = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const prev = store.getState();
    const records = [...prev.records];
    if (fromIndex < 0 || fromIndex >= records.length || toIndex < 0 || toIndex >= records.length) {
      return;
    }
    const [movedItem] = records.splice(fromIndex, 1);
    records.splice(toIndex, 0, movedItem);

    const next: CollectionState<T> = { ...prev, records };
    store.setState(next);
    await persist(next);
  };

  const hydrate = async () => {
    const raw = await storage.get(storageKey);
    store.setState({ records: parseRecords(raw, initialValue), loading: false });
  };

  void hydrate();

  const useCollection = (): UseCollectionType<T> => {
    const state = useExternalStore(store, (s) => s);
    return {
      records: state.records,
      loading: state.loading,
      add,
      update,
      remove,
      reorder,
      move,
    };
  };

  return {
    store,
    actions: { add, update, remove, reorder, move },
    useCollection,
    useValue: useCollection,
    Provider,
  };
};

export default createCollection;
