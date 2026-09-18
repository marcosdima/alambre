import { useMemo, type ReactNode } from 'react';
import { createCollectionProvider } from 'alambre';
import { storage } from '../storage';
import type { CompletedRecord, GameMode } from '../domain/types';

const { Provider: RecordsCollectionProvider, useValue } = createCollectionProvider<CompletedRecord>({
  storage,
  storageKey: 'cross-logic.records',
  hookName: 'Records',
});

export const RecordsProvider = ({ children }: { children: ReactNode }) => (
  <RecordsCollectionProvider>{children}</RecordsCollectionProvider>
);

export const useRecords = () => {
  const value = useValue();

  return useMemo(
    () => ({
      records: value.records,
      loading: value.loading,
      addRecord: value.add,
      getBestTime: (puzzleId: string, mode?: GameMode): number | null => {
        const matches = value.records.filter(
          (r) => r.id === puzzleId && (mode === undefined || r.mode === mode),
        );
        if (matches.length === 0) return null;
        return Math.min(...matches.map((r) => r.elapsedSeconds));
      },
      isPuzzleCompleted: (puzzleId: string, mode?: GameMode): boolean => {
        return value.records.some(
          (r) => r.id === puzzleId && (mode === undefined || r.mode === mode),
        );
      },
    }),
    [value],
  );
};
