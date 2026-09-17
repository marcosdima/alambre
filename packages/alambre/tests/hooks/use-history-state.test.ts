import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  useHistoryState,
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo,
  canRedo,
} from '../../src/hooks/use-history-state';

describe('pure history model helpers', () => {
  it('creates an initial history container', () => {
    const history = createHistory(10);
    expect(history.present).toBe(10);
    expect(history.past).toEqual([]);
    expect(history.future).toEqual([]);
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(false);
  });

  it('pushes new states and clears future', () => {
    let history = createHistory('a');
    history = pushHistory(history, 'b');
    expect(history.present).toBe('b');
    expect(history.past).toEqual(['a']);
    expect(canUndo(history)).toBe(true);

    history = pushHistory(history, 'c');
    expect(history.present).toBe('c');
    expect(history.past).toEqual(['a', 'b']);
  });

  it('undos and redos states correctly', () => {
    let history = createHistory(1);
    history = pushHistory(history, 2);
    history = pushHistory(history, 3);

    history = undoHistory(history);
    expect(history.present).toBe(2);
    expect(history.past).toEqual([1]);
    expect(history.future).toEqual([3]);
    expect(canRedo(history)).toBe(true);

    history = redoHistory(history);
    expect(history.present).toBe(3);
    expect(history.past).toEqual([1, 2]);
    expect(history.future).toEqual([]);
  });

  it('enforces maxLimit when pushing history', () => {
    let history = createHistory(0, 2);
    history = pushHistory(history, 1);
    history = pushHistory(history, 2);
    history = pushHistory(history, 3);

    expect(history.present).toBe(3);
    expect(history.past).toEqual([1, 2]);
  });
});

describe('useHistoryState hook', () => {
  it('initializes with given state', () => {
    const { result } = renderHook(() => useHistoryState('initial'));
    expect(result.current.state).toBe('initial');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('updates state and allows undoing and redoing', () => {
    const { result } = renderHook(() => useHistoryState<number>(0));

    act(() => {
      result.current.set(1);
    });
    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.set((prev) => prev + 1);
    });
    expect(result.current.state).toBe(2);

    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe(1);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toBe(2);
  });

  it('resets history with new initial state', () => {
    const { result } = renderHook(() => useHistoryState('alpha'));

    act(() => {
      result.current.set('beta');
      result.current.set('gamma');
    });
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.reset('fresh');
    });

    expect(result.current.state).toBe('fresh');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('respects maxLimit option', () => {
    const { result } = renderHook(() => useHistoryState<number>(0, { maxLimit: 2 }));

    act(() => {
      result.current.set(1);
      result.current.set(2);
      result.current.set(3);
    });

    expect(result.current.state).toBe(3);
    expect(result.current.history.past).toEqual([1, 2]);
  });
});
