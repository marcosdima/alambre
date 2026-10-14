export type CollectionRecord = {
  id: string;
};

export type CollectionState<T extends CollectionRecord> = {
  records: T[];
  loading: boolean;
};

export type UseCollectionType<T extends CollectionRecord> = {
  records: T[];
  loading: boolean;
  add: (record: T) => Promise<void>;
  update: (id: string, patch: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (records: T[]) => Promise<void>;
  move: (fromIndex: number, toIndex: number) => Promise<void>;
};
