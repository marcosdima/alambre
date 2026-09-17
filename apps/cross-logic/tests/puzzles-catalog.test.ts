import { describe, it, expect } from 'vitest';
import { BUILTIN_PUZZLES } from '../src/domain/puzzles/catalog';
import {
  initializeGrid,
  checkVictory,
  createPairKey,
} from '../src/domain/grid-model';
import {
  getAllPuzzles,
  getPuzzlesByDifficulty,
  getRandomPuzzle,
} from '../src/domain/puzzles/service';

describe('puzzles catalog & service', () => {
  it('has valid built-in puzzles with unique IDs and categories', () => {
    expect(BUILTIN_PUZZLES.length).toBeGreaterThanOrEqual(4);
    const ids = BUILTIN_PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const puzzle of BUILTIN_PUZZLES) {
      expect(puzzle.categories.length).toBeGreaterThanOrEqual(3);
      expect(puzzle.clues.length).toBeGreaterThanOrEqual(3);
      expect(puzzle.solutionTuples.length).toBeGreaterThanOrEqual(3);

      // Verify that every solution tuple has all categories
      for (const tuple of puzzle.solutionTuples) {
        for (const cat of puzzle.categories) {
          expect(tuple[cat.id]).toBeDefined();
        }
      }
    }
  });

  it('verifies that full solution for every built-in puzzle yields victory', () => {
    for (const puzzle of BUILTIN_PUZZLES) {
      const grid = initializeGrid(puzzle);

      // Mark all true pairs in grid
      for (const tuple of puzzle.solutionTuples) {
        for (let i = 0; i < puzzle.categories.length; i += 1) {
          for (let j = i + 1; j < puzzle.categories.length; j += 1) {
            const catA = puzzle.categories[i].id;
            const catB = puzzle.categories[j].id;
            const itemA = tuple[catA];
            const itemB = tuple[catB];
            const key = createPairKey(catA, itemA, catB, itemB);
            grid[key] = 'tick';
          }
        }
      }

      expect(checkVictory(puzzle, grid)).toBe(true);
    }
  });

  it('queries puzzles by difficulty', () => {
    const easy = getPuzzlesByDifficulty('easy');
    const medium = getPuzzlesByDifficulty('medium');
    const hard = getPuzzlesByDifficulty('hard');

    expect(easy.length).toBeGreaterThanOrEqual(2);
    expect(medium.length).toBeGreaterThanOrEqual(1);
    expect(hard.length).toBeGreaterThanOrEqual(1);
  });

  it('selects random puzzle from requested difficulty', () => {
    const puzzle = getRandomPuzzle('easy');
    expect(puzzle.difficulty).toBe('easy');
  });

  it('combines custom puzzles with builtin puzzles', () => {
    const custom = [{
      id: 'custom-1',
      title: 'Custom Test',
      difficulty: 'easy' as const,
      categories: [],
      clues: [],
      solutionTuples: [],
    }];

    const all = getAllPuzzles(custom);
    expect(all.some((p) => p.id === 'custom-1')).toBe(true);
  });
});
