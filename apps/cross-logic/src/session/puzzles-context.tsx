import { useMemo, type ReactNode } from 'react';
import { createCollectionProvider } from 'alambre';
import { storage } from '../storage';
import type { PuzzleDefinition } from '../domain/types';

const { Provider: CustomPuzzlesCollectionProvider, useValue } = createCollectionProvider<PuzzleDefinition>({
  storage,
  storageKey: 'cross-logic.customPuzzles',
  hookName: 'CustomPuzzles',
});

export const PuzzlesProvider = ({ children }: { children: ReactNode }) => (
  <CustomPuzzlesCollectionProvider>{children}</CustomPuzzlesCollectionProvider>
);

export const usePuzzles = () => {
  const value = useValue();

  return useMemo(
    () => ({
      customPuzzles: value.records,
      loading: value.loading,
      savePuzzle: async (puzzle: PuzzleDefinition) => {
        const exists = value.records.some((p) => p.id === puzzle.id);
        if (exists) {
          await value.update(puzzle.id, puzzle);
        } else {
          await value.add(puzzle);
        }
      },
      deletePuzzle: value.remove,
    }),
    [value],
  );
};
