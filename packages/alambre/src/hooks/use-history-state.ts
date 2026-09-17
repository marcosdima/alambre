import { useCallback, useState } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
  maxLimit?: number;
}

export interface UseHistoryStateOptions {
  maxLimit?: number;
}

export interface UseHistoryStateReturn<T> {
  state: T;
  set: (nextState: T | ((current: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  reset: (initialState: T) => void;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryState<T>;
}

export const createHistory = <T>(initial: T, maxLimit?: number): HistoryState<T> => ({
  past: [],
  present: initial,
  future: [],
  maxLimit,
});

export const pushHistory = <T>(history: HistoryState<T>, nextPresent: T): HistoryState<T> => {
  const newPast = [...history.past, history.present];
  if (history.maxLimit && newPast.length > history.maxLimit) {
    newPast.splice(0, newPast.length - history.maxLimit);
  }
  return {
    past: newPast,
    present: nextPresent,
    future: [],
    maxLimit: history.maxLimit,
  };
};

export const undoHistory = <T>(history: HistoryState<T>): HistoryState<T> => {
  if (history.past.length === 0) return history;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, history.past.length - 1);

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
    maxLimit: history.maxLimit,
  };
};

export const redoHistory = <T>(history: HistoryState<T>): HistoryState<T> => {
  if (history.future.length === 0) return history;

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
    maxLimit: history.maxLimit,
  };
};

export const canUndo = <T>(history: HistoryState<T>): boolean => history.past.length > 0;
export const canRedo = <T>(history: HistoryState<T>): boolean => history.future.length > 0;

export function useHistoryState<T>(
  initialState: T,
  options?: UseHistoryStateOptions,
): UseHistoryStateReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>(() =>
    createHistory(initialState, options?.maxLimit),
  );

  const set = useCallback(
    (nextState: T | ((current: T) => T)) => {
      setHistory((prev) => {
        const resolvedNext =
          typeof nextState === 'function'
            ? (nextState as (current: T) => T)(prev.present)
            : nextState;
        return pushHistory(prev, resolvedNext);
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setHistory((prev) => undoHistory(prev));
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => redoHistory(prev));
  }, []);

  const reset = useCallback(
    (newInitialState: T) => {
      setHistory(createHistory(newInitialState, options?.maxLimit));
    },
    [options?.maxLimit],
  );

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
    history,
  };
}
