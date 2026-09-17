import { describe, it, expect } from 'vitest';
import {
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
} from '../src/domain/history-model';

describe('history-model', () => {
  it('creates empty history container', () => {
    const history = createHistory<number>(1);
    expect(history.present).toBe(1);
    expect(history.past).toEqual([]);
    expect(history.future).toEqual([]);
  });

  it('pushes new state to past and clears future', () => {
    let history = createHistory<string>('A');
    history = pushHistory(history, 'B');
    expect(history.present).toBe('B');
    expect(history.past).toEqual(['A']);
    expect(history.future).toEqual([]);

    history = pushHistory(history, 'C');
    expect(history.present).toBe('C');
    expect(history.past).toEqual(['A', 'B']);
  });

  it('undos previous state and moves current to future', () => {
    let history = createHistory<string>('A');
    history = pushHistory(history, 'B');
    history = pushHistory(history, 'C');

    history = undoHistory(history);
    expect(history.present).toBe('B');
    expect(history.past).toEqual(['A']);
    expect(history.future).toEqual(['C']);

    history = undoHistory(history);
    expect(history.present).toBe('A');
    expect(history.past).toEqual([]);
    expect(history.future).toEqual(['B', 'C']);

    // Undoing at start does nothing
    const unchanged = undoHistory(history);
    expect(unchanged).toBe(history);
  });

  it('redos future state and moves present to past', () => {
    let history = createHistory<string>('A');
    history = pushHistory(history, 'B');
    history = pushHistory(history, 'C');
    history = undoHistory(history); // at B
    history = undoHistory(history); // at A

    history = redoHistory(history);
    expect(history.present).toBe('B');
    expect(history.past).toEqual(['A']);
    expect(history.future).toEqual(['C']);

    history = redoHistory(history);
    expect(history.present).toBe('C');
    expect(history.past).toEqual(['A', 'B']);
    expect(history.future).toEqual([]);

    // Redoing at latest does nothing
    const unchanged = redoHistory(history);
    expect(unchanged).toBe(history);
  });

  it('limits past history to maxLimit if specified', () => {
    let history = createHistory<number>(0, 3);
    for (let i = 1; i <= 5; i += 1) {
      history = pushHistory(history, i);
    }
    expect(history.present).toBe(5);
    expect(history.past).toEqual([2, 3, 4]);
  });
});
