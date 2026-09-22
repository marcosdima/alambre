import type {
  CellState,
  GridState,
  PuzzleDefinition,
  SubgridPair,
} from './types';

export const createPairKey = (
  catAId: string,
  itemAId: string,
  catBId: string,
  itemBId: string,
): string => {
  if (catAId < catBId) {
    return `${catAId}:${itemAId}__${catBId}:${itemBId}`;
  }
  return `${catBId}:${itemBId}__${catAId}:${itemAId}`;
};

export const parsePairKey = (
  pairKey: string,
): { catAId: string; itemAId: string; catBId: string; itemBId: string } => {
  const [partA, partB] = pairKey.split('__');
  const [catAId, itemAId] = partA.split(':');
  const [catBId, itemBId] = partB.split(':');
  return { catAId, itemAId, catBId, itemBId };
};

export const getSubgridPairs = (puzzle: PuzzleDefinition): SubgridPair[] => {
  const pairs: SubgridPair[] = [];
  const cats = puzzle.categories;

  for (let i = 0; i < cats.length; i += 1) {
    for (let j = i + 1; j < cats.length; j += 1) {
      pairs.push({
        rowCatIndex: i,
        colCatIndex: j,
        rowCatId: cats[i].id,
        colCatId: cats[j].id,
      });
    }
  }

  return pairs;
};

export const initializeGrid = (puzzle: PuzzleDefinition): GridState => {
  const grid: GridState = {};
  const pairs = getSubgridPairs(puzzle);

  for (const pair of pairs) {
    const catA = puzzle.categories[pair.rowCatIndex];
    const catB = puzzle.categories[pair.colCatIndex];

    for (const itemA of catA.items) {
      for (const itemB of catB.items) {
        const key = createPairKey(catA.id, itemA.id, catB.id, itemB.id);
        grid[key] = 'empty';
      }
    }
  }

  return grid;
};

export const nextCellState = (current: CellState): CellState => {
  switch (current) {
    case 'empty':
      return 'cross';
    case 'cross':
      return 'tick';
    case 'tick':
      return 'empty';
    case 'auto-cross':
      return 'auto-cross';
    default:
      return 'empty';
  }
};

export const recomputeAutoCross = (
  puzzle: PuzzleDefinition,
  grid: GridState,
): GridState => {
  const nextGrid: GridState = {};

  // Preserve manual marks ('cross', 'tick', 'empty'), resetting inferred 'auto-cross'
  for (const [key, state] of Object.entries(grid)) {
    nextGrid[key] = state === 'auto-cross' ? 'empty' : state;
  }

  // Infer auto-crosses from all ticks
  for (const [key, state] of Object.entries(nextGrid)) {
    if (state === 'tick') {
      const { catAId, itemAId, catBId, itemBId } = parsePairKey(key);
      const catA = puzzle.categories.find((c) => c.id === catAId);
      const catB = puzzle.categories.find((c) => c.id === catBId);

      if (!catA || !catB) continue;

      // Cross out other items in catB for itemA
      for (const otherB of catB.items) {
        if (otherB.id !== itemBId) {
          const pairKey = createPairKey(catAId, itemAId, catBId, otherB.id);
          if (nextGrid[pairKey] === 'empty') {
            nextGrid[pairKey] = 'auto-cross';
          }
        }
      }

      // Cross out other items in catA for itemB
      for (const otherA of catA.items) {
        if (otherA.id !== itemAId) {
          const pairKey = createPairKey(catAId, otherA.id, catBId, itemBId);
          if (nextGrid[pairKey] === 'empty') {
            nextGrid[pairKey] = 'auto-cross';
          }
        }
      }
    }
  }

  return nextGrid;
};

export const isPairTrueInSolution = (
  puzzle: PuzzleDefinition,
  catAId: string,
  itemAId: string,
  catBId: string,
  itemBId: string,
): boolean => {
  return puzzle.solutionTuples.some(
    (tuple) => tuple[catAId] === itemAId && tuple[catBId] === itemBId,
  );
};

export const isCellCorrect = (
  puzzle: PuzzleDefinition,
  pairKey: string,
  state: CellState,
): boolean => {
  if (state === 'empty') return true;
  const { catAId, itemAId, catBId, itemBId } = parsePairKey(pairKey);
  const isTrue = isPairTrueInSolution(puzzle, catAId, itemAId, catBId, itemBId);
  if (state === 'tick') return isTrue;
  return !isTrue;
};

export const checkVictory = (
  puzzle: PuzzleDefinition,
  grid: GridState,
): boolean => {
  const pairs = getSubgridPairs(puzzle);

  for (const pair of pairs) {
    const catA = puzzle.categories[pair.rowCatIndex];
    const catB = puzzle.categories[pair.colCatIndex];

    for (const itemA of catA.items) {
      for (const itemB of catB.items) {
        const key = createPairKey(catA.id, itemA.id, catB.id, itemB.id);
        const cell = grid[key];
        const isTrue = isPairTrueInSolution(puzzle, catA.id, itemA.id, catB.id, itemB.id);

        if (isTrue) {
          if (cell !== 'tick') {
            return false;
          }
        } else if (cell === 'tick') {
          return false;
        }
      }
    }
  }

  return true;
};
