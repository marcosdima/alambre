import { describe, it, expect } from 'vitest';
import {
  createPairKey,
  initializeGrid,
  nextCellState,
  applyAutoCross,
  checkVictory,
  isCellCorrect,
  getSubgridPairs,
} from '../src/domain/grid-model';
import type { PuzzleDefinition } from '../src/domain/types';

const mockPuzzle: PuzzleDefinition = {
  id: 'test-puzzle-1',
  title: 'Test Puzzle',
  difficulty: 'easy',
  categories: [
    {
      id: 'persons',
      name: 'Personas',
      items: [
        { id: 'p1', name: 'Ana' },
        { id: 'p2', name: 'Beto' },
      ],
    },
    {
      id: 'pets',
      name: 'Mascotas',
      items: [
        { id: 'pet1', name: 'Perro' },
        { id: 'pet2', name: 'Gato' },
      ],
    },
    {
      id: 'drinks',
      name: 'Bebidas',
      items: [
        { id: 'd1', name: 'Café' },
        { id: 'd2', name: 'Té' },
      ],
    },
  ],
  clues: [
    { id: 'c1', text: 'Ana tiene un perro.' },
    { id: 'c2', text: 'El dueño del perro toma té.' },
  ],
  solutionTuples: [
    { persons: 'p1', pets: 'pet1', drinks: 'd2' },
    { persons: 'p2', pets: 'pet2', drinks: 'd1' },
  ],
};

describe('grid-model', () => {
  it('creates consistent canonical pair keys regardless of parameter order', () => {
    const key1 = createPairKey('persons', 'p1', 'pets', 'pet1');
    const key2 = createPairKey('pets', 'pet1', 'persons', 'p1');
    expect(key1).toBe(key2);
  });

  it('initializes grid with empty states for all category pairs', () => {
    const grid = initializeGrid(mockPuzzle);
    // 3 categories, each pair has 2x2 = 4 cells.
    // Pairs: (persons, pets), (persons, drinks), (pets, drinks) = 3 * 4 = 12 cells.
    expect(Object.keys(grid)).toHaveLength(12);
    expect(Object.values(grid).every((state) => state === 'empty')).toBe(true);
  });

  it('cycles cell state in order: empty -> cross -> tick -> empty', () => {
    expect(nextCellState('empty')).toBe('cross');
    expect(nextCellState('cross')).toBe('tick');
    expect(nextCellState('tick')).toBe('empty');
  });

  it('applies auto-cross to row and column in the same subgrid when a tick is placed', () => {
    let grid = initializeGrid(mockPuzzle);
    const keyP1Pet1 = createPairKey('persons', 'p1', 'pets', 'pet1');
    grid[keyP1Pet1] = 'tick';

    grid = applyAutoCross(mockPuzzle, grid, 'persons', 'p1', 'pets', 'pet1');

    // Row: other pets for p1 (p1 - pet2) should become 'cross'
    const keyP1Pet2 = createPairKey('persons', 'p1', 'pets', 'pet2');
    expect(grid[keyP1Pet2]).toBe('cross');

    // Column: other persons for pet1 (p2 - pet1) should become 'cross'
    const keyP2Pet1 = createPairKey('persons', 'p2', 'pets', 'pet1');
    expect(grid[keyP2Pet1]).toBe('cross');

    // Diagonal (p2 - pet2) should remain 'empty'
    const keyP2Pet2 = createPairKey('persons', 'p2', 'pets', 'pet2');
    expect(grid[keyP2Pet2]).toBe('empty');
  });

  it('checks cell correctness against solution', () => {
    const correctKey = createPairKey('persons', 'p1', 'pets', 'pet1');
    const incorrectKey = createPairKey('persons', 'p1', 'pets', 'pet2');

    expect(isCellCorrect(mockPuzzle, correctKey, 'tick')).toBe(true);
    expect(isCellCorrect(mockPuzzle, correctKey, 'cross')).toBe(false);

    expect(isCellCorrect(mockPuzzle, incorrectKey, 'cross')).toBe(true);
    expect(isCellCorrect(mockPuzzle, incorrectKey, 'tick')).toBe(false);
  });

  it('detects victory when all positive relations are correctly set to tick without conflicting ticks', () => {
    const grid = initializeGrid(mockPuzzle);
    expect(checkVictory(mockPuzzle, grid)).toBe(false);

    // Solution:
    // (p1, pet1), (p1, d2), (pet1, d2)
    // (p2, pet2), (p2, d1), (pet2, d1)
    grid[createPairKey('persons', 'p1', 'pets', 'pet1')] = 'tick';
    grid[createPairKey('persons', 'p1', 'drinks', 'd2')] = 'tick';
    grid[createPairKey('pets', 'pet1', 'drinks', 'd2')] = 'tick';

    grid[createPairKey('persons', 'p2', 'pets', 'pet2')] = 'tick';
    grid[createPairKey('persons', 'p2', 'drinks', 'd1')] = 'tick';
    grid[createPairKey('pets', 'pet2', 'drinks', 'd1')] = 'tick';

    expect(checkVictory(mockPuzzle, grid)).toBe(true);

    // If an extra false tick is placed, victory is false
    grid[createPairKey('persons', 'p1', 'pets', 'pet2')] = 'tick';
    expect(checkVictory(mockPuzzle, grid)).toBe(false);
  });

  it('computes subgrid pairs for rendering grid columns and rows', () => {
    const pairs = getSubgridPairs(mockPuzzle);
    // For 3 categories (0: persons, 1: pets, 2: drinks):
    // (0, 1) -> persons, pets
    // (0, 2) -> persons, drinks
    // (1, 2) -> pets, drinks
    expect(pairs).toHaveLength(3);
    expect(pairs[0]).toEqual({ rowCatIndex: 0, colCatIndex: 1, rowCatId: 'persons', colCatId: 'pets' });
    expect(pairs[1]).toEqual({ rowCatIndex: 0, colCatIndex: 2, rowCatId: 'persons', colCatId: 'drinks' });
    expect(pairs[2]).toEqual({ rowCatIndex: 1, colCatIndex: 2, rowCatId: 'pets', colCatId: 'drinks' });
  });
});
