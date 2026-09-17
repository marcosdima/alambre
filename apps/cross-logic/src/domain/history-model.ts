export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
  maxLimit?: number;
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
