import type { Difficulty, PuzzleDefinition } from '../types';
import { BUILTIN_PUZZLES } from './catalog';

export const getAllPuzzles = (customPuzzles: PuzzleDefinition[] = []): PuzzleDefinition[] => {
  return [...BUILTIN_PUZZLES, ...customPuzzles];
};

export const getPuzzlesByDifficulty = (
  difficulty: Difficulty,
  customPuzzles: PuzzleDefinition[] = [],
): PuzzleDefinition[] => {
  const all = getAllPuzzles(customPuzzles);
  return all.filter((p) => p.difficulty === difficulty);
};

export const getPuzzleById = (
  id: string,
  customPuzzles: PuzzleDefinition[] = [],
): PuzzleDefinition | undefined => {
  const all = getAllPuzzles(customPuzzles);
  return all.find((p) => p.id === id);
};

export const getRandomPuzzle = (
  difficulty: Difficulty,
  customPuzzles: PuzzleDefinition[] = [],
  excludeId?: string,
): PuzzleDefinition => {
  const pool = getPuzzlesByDifficulty(difficulty, customPuzzles);
  const filtered = excludeId && pool.length > 1
    ? pool.filter((p) => p.id !== excludeId)
    : pool;

  if (filtered.length === 0) {
    // Fallback to first puzzle in catalog if empty
    return BUILTIN_PUZZLES[0];
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
};
