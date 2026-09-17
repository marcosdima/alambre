export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameMode = 'zen' | 'challenge';

export type CellState = 'empty' | 'cross' | 'tick';

export interface CategoryItem {
  id: string;
  name: string;
  icon?: string;
}

export interface Category {
  id: string;
  name: string;
  items: CategoryItem[];
}

export interface Clue {
  id: string;
  text: string;
}

export type SolutionTuple = Record<string, string>; // { [categoryId]: itemId }

export interface PuzzleDefinition {
  id: string;
  title: string;
  difficulty: Difficulty;
  story?: string;
  author?: 'builtin' | 'user' | string;
  categories: Category[];
  clues: Clue[];
  solutionTuples: SolutionTuple[];
}

export type GridState = Record<string, CellState>;

export interface SubgridPair {
  rowCatIndex: number;
  colCatIndex: number;
  rowCatId: string;
  colCatId: string;
}

export interface GameSession {
  puzzleId: string;
  grid: GridState;
  strikethroughClues: string[];
  mistakesCount: number;
  elapsedSeconds: number;
  isCompleted: boolean;
  history: GridState[];
  future: GridState[];
  mode: GameMode;
}

export interface CompletedRecord {
  id: string; // puzzleId
  completedAt: string;
  elapsedSeconds: number;
  mistakesCount: number;
  difficulty: Difficulty;
  mode: GameMode;
}
