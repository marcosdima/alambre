import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Difficulty,
  GameMode,
  GridState,
  PuzzleDefinition,
} from '../domain/types';
import {
  applyAutoCross,
  checkVictory,
  createPairKey,
  initializeGrid,
  isCellCorrect,
  nextCellState,
} from '../domain/grid-model';
import {
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo as checkCanUndo,
  canRedo as checkCanRedo,
  type HistoryState,
} from '../domain/history-model';
import { getRandomPuzzle, getPuzzleById } from '../domain/puzzles/service';
import { useConfig } from '../providers/config';
import { useRecords } from './records-context';

interface GameContextType {
  activePuzzle: PuzzleDefinition | null;
  grid: GridState;
  strikethroughClues: string[];
  mistakesCount: number;
  elapsedSeconds: number;
  isCompleted: boolean;
  isDefeated: boolean;
  canUndo: boolean;
  canRedo: boolean;
  mode: GameMode;
  difficulty: Difficulty;
  startNewGame: (difficulty?: Difficulty, mode?: GameMode, puzzleId?: string) => void;
  cellTapped: (catAId: string, itemAId: string, catBId: string, itemBId: string) => { isMistake: boolean };
  toggleClueStrikethrough: (clueId: string) => void;
  undo: () => void;
  redo: () => void;
  resetGrid: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { config } = useConfig();
  const { addRecord } = useRecords();

  const [activePuzzle, setActivePuzzle] = useState<PuzzleDefinition | null>(null);
  const [history, setHistory] = useState<HistoryState<GridState>>(() => createHistory<GridState>({}));
  const [strikethroughClues, setStrikethroughClues] = useState<string[]>([]);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);
  const [mode, setMode] = useState<GameMode>((config.defaultMode as GameMode) || 'zen');
  const [difficulty, setDifficulty] = useState<Difficulty>((config.defaultDifficulty as Difficulty) || 'easy');

  const startNewGame = useCallback((
    selectedDifficulty?: Difficulty,
    selectedMode?: GameMode,
    puzzleId?: string,
  ) => {
    const diff = selectedDifficulty ?? difficulty;
    const gMode = selectedMode ?? mode;
    const puzzle = puzzleId
      ? (getPuzzleById(puzzleId) ?? getRandomPuzzle(diff))
      : getRandomPuzzle(diff);

    const initialGrid = initializeGrid(puzzle);
    setActivePuzzle(puzzle);
    setDifficulty(diff);
    setMode(gMode);
    setHistory(createHistory(initialGrid, 50));
    setStrikethroughClues([]);
    setMistakesCount(0);
    setElapsedSeconds(0);
    setIsCompleted(false);
    setIsDefeated(false);
  }, [difficulty, mode]);

  // Timer effect
  useEffect(() => {
    if (!activePuzzle || isCompleted || isDefeated) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activePuzzle, isCompleted, isDefeated]);

  const cellTapped = useCallback((
    catAId: string,
    itemAId: string,
    catBId: string,
    itemBId: string,
  ): { isMistake: boolean } => {
    if (!activePuzzle || isCompleted || isDefeated) return { isMistake: false };

    const pairKey = createPairKey(catAId, itemAId, catBId, itemBId);
    const currentGrid = history.present;
    const currentState = currentGrid[pairKey] ?? 'empty';
    const nextState = nextCellState(currentState);

    let isMistake = false;
    if (mode === 'challenge' && nextState !== 'empty') {
      const correct = isCellCorrect(activePuzzle, pairKey, nextState);
      if (!correct) {
        isMistake = true;
        setMistakesCount((prev) => {
          const updated = prev + 1;
          if (updated >= 3) {
            setIsDefeated(true);
          }
          return updated;
        });
      }
    }

    let updatedGrid = { ...currentGrid, [pairKey]: nextState };

    if (nextState === 'tick' && config.autoCross === 'true') {
      updatedGrid = applyAutoCross(
        activePuzzle,
        updatedGrid,
        catAId,
        itemAId,
        catBId,
        itemBId,
      );
    }

    setHistory((prev) => pushHistory(prev, updatedGrid));

    if (checkVictory(activePuzzle, updatedGrid)) {
      setIsCompleted(true);
      void addRecord({
        id: activePuzzle.id,
        completedAt: new Date().toISOString(),
        elapsedSeconds: elapsedSeconds + 1,
        mistakesCount,
        difficulty: activePuzzle.difficulty,
        mode,
      });
    }

    return { isMistake };
  }, [activePuzzle, isCompleted, isDefeated, history.present, mode, config.autoCross, elapsedSeconds, mistakesCount, addRecord]);

  const toggleClueStrikethrough = useCallback((clueId: string) => {
    setStrikethroughClues((prev) =>
      prev.includes(clueId) ? prev.filter((id) => id !== clueId) : [...prev, clueId],
    );
  }, []);

  const undo = useCallback(() => {
    if (!checkCanUndo(history)) return;
    setHistory((prev) => undoHistory(prev));
  }, [history]);

  const redo = useCallback(() => {
    if (!checkCanRedo(history)) return;
    setHistory((prev) => redoHistory(prev));
  }, [history]);

  const resetGrid = useCallback(() => {
    if (!activePuzzle) return;
    const cleanGrid = initializeGrid(activePuzzle);
    setHistory(createHistory(cleanGrid, 50));
    setStrikethroughClues([]);
    setMistakesCount(0);
    setElapsedSeconds(0);
    setIsCompleted(false);
    setIsDefeated(false);
  }, [activePuzzle]);

  const value = useMemo(() => ({
    activePuzzle,
    grid: history.present,
    strikethroughClues,
    mistakesCount,
    elapsedSeconds,
    isCompleted,
    isDefeated,
    canUndo: checkCanUndo(history),
    canRedo: checkCanRedo(history),
    mode,
    difficulty,
    startNewGame,
    cellTapped,
    toggleClueStrikethrough,
    undo,
    redo,
    resetGrid,
  }), [
    activePuzzle,
    history,
    strikethroughClues,
    mistakesCount,
    elapsedSeconds,
    isCompleted,
    isDefeated,
    mode,
    difficulty,
    startNewGame,
    cellTapped,
    toggleClueStrikethrough,
    undo,
    redo,
    resetGrid,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
