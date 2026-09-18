import { describe, it, expect } from 'vitest';
import {
  permutations,
  compareSolutionTuples,
  solvePuzzle,
} from '../src/domain/solver';
import type { Category, Clue, SolutionTuple } from '../src/domain/types';

describe('solver', () => {
  it('generates all permutations of array', () => {
    expect(permutations([1, 2])).toEqual([[1, 2], [2, 1]]);
    expect(permutations(['a', 'b', 'c'])).toHaveLength(6);
    expect(permutations([1, 2, 3, 4])).toHaveLength(24);
  });

  it('compares solution tuples order-independently', () => {
    const sol1: SolutionTuple[] = [
      { persons: 'p1', pets: 'd1' },
      { persons: 'p2', pets: 'd2' },
    ];
    const sol2: SolutionTuple[] = [
      { persons: 'p2', pets: 'd2' },
      { persons: 'p1', pets: 'd1' },
    ];
    const solMismatch: SolutionTuple[] = [
      { persons: 'p1', pets: 'd2' },
      { persons: 'p2', pets: 'd1' },
    ];

    expect(compareSolutionTuples(sol1, sol2)).toBe(true);
    expect(compareSolutionTuples(sol1, solMismatch)).toBe(false);
  });

  const sampleCategories: Category[] = [
    {
      id: 'persons',
      name: 'Personas',
      items: [
        { id: 'ana', name: 'Ana' },
        { id: 'bruno', name: 'Bruno' },
      ],
    },
    {
      id: 'pets',
      name: 'Mascotas',
      items: [
        { id: 'perro', name: 'Perro' },
        { id: 'gato', name: 'Gato' },
      ],
    },
  ];

  const declaredSolution: SolutionTuple[] = [
    { persons: 'ana', pets: 'gato' },
    { persons: 'bruno', pets: 'perro' },
  ];

  it('validates a puzzle with a unique matching solution', () => {
    const clues: Clue[] = [
      {
        id: 'c1',
        text: 'Ana tiene el gato.',
        relation: {
          type: 'is',
          catAId: 'persons',
          itemAId: 'ana',
          catBId: 'pets',
          itemBId: 'gato',
        },
      },
    ];

    const result = solvePuzzle({
      categories: sampleCategories,
      clues,
      solutionTuples: declaredSolution,
    });

    expect(result.status).toBe('valid');
    expect(result.solutionsCount).toBe(1);
    expect(result.matchesDeclaredSolution).toBe(true);
  });

  it('detects ambiguous puzzles with multiple solutions', () => {
    // 3 categories x 3 items with only 1 clue: multiple solutions exist
    const categories3x3: Category[] = [
      {
        id: 'c1',
        name: 'Cat 1',
        items: [{ id: '1a', name: '1A' }, { id: '1b', name: '1B' }, { id: '1c', name: '1C' }],
      },
      {
        id: 'c2',
        name: 'Cat 2',
        items: [{ id: '2a', name: '2A' }, { id: '2b', name: '2B' }, { id: '2c', name: '2C' }],
      },
    ];

    const result = solvePuzzle({
      categories: categories3x3,
      clues: [],
    });

    expect(result.status).toBe('ambiguous');
    expect(result.solutionsCount).toBeGreaterThan(1);
  });

  it('detects contradictory clues with 0 solutions', () => {
    const clues: Clue[] = [
      {
        id: 'c1',
        text: 'Ana tiene el gato.',
        relation: {
          type: 'is',
          catAId: 'persons',
          itemAId: 'ana',
          catBId: 'pets',
          itemBId: 'gato',
        },
      },
      {
        id: 'c2',
        text: 'Ana NO tiene el gato.',
        relation: {
          type: 'isNot',
          catAId: 'persons',
          itemAId: 'ana',
          catBId: 'pets',
          itemBId: 'gato',
        },
      },
    ];

    const result = solvePuzzle({
      categories: sampleCategories,
      clues,
      solutionTuples: declaredSolution,
    });

    expect(result.status).toBe('invalid');
    expect(result.solutionsCount).toBe(0);
  });

  it('flags puzzle as invalid if unique solution does not match declared solution', () => {
    const clues: Clue[] = [
      {
        id: 'c1',
        text: 'Ana tiene el perro.',
        relation: {
          type: 'is',
          catAId: 'persons',
          itemAId: 'ana',
          catBId: 'pets',
          itemBId: 'perro',
        },
      },
    ];

    // declaredSolution has Ana with Gato!
    const result = solvePuzzle({
      categories: sampleCategories,
      clues,
      solutionTuples: declaredSolution,
    });

    expect(result.status).toBe('invalid');
    expect(result.matchesDeclaredSolution).toBe(false);
  });
});
