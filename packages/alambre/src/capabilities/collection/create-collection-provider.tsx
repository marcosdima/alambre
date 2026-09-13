import type { Storage } from '../../types/actions';
import createProvider from '../../core/create-provider';
import createStore from '../../core/create-store';
import type { CollectionRecord, CollectionState, UseCollectionType } from './collection-types';

type CollectionActions<T extends CollectionRecord> = {
  add: (record: T) => Promise<void>;
  update: (id: string, patch: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

type CollectionOptions<T extends CollectionRecord> = {
  storage: Storage;
  storageKey: string;
  initialValue?: T[];
  hookName?: string;
};

const parseRecords = <T extends CollectionRecord>(raw: string | null, fallback: T[]): T[] => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
};

const createCollectionProvider = <T extends CollectionRecord>({
  storage,
  storageKey,
  initialValue = [],
  hookName = 'Collection',
}: CollectionOptions<T>) => {
  const { Provider, useValue } = createProvider<
    CollectionState<T>,
    CollectionActions<T>,
    UseCollectionType<T>
  >({
    setup: () => {
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

      const hydrate = async () => {
        const raw = await storage.get(storageKey);
        store.setState({ records: parseRecords(raw, initialValue), loading: false });
      };

      return { store, actions: { add, update, remove }, hydrate };
    },
    mapValue: (state, actions) => ({
      records: state.records,
      loading: state.loading,
      ...actions,
    }),
    missingProviderError: `use${hookName} must be used within ${hookName}Provider`,
  });

  return {
    Provider,
    useValue,
  };
};

export default createCollectionProvider;
