import { describe, expect, it, vi } from 'vitest';
import createStore from '../../src/core/create-store';

type CountState = { count: number };

describe('createStore', () => {
  it('exposes the initial state through getState', () => {
    const store = createStore<CountState>({ count: 0 });
    expect(store.getState()).toEqual({ count: 0 });
  });

  it('notifies listeners when the state changes to a new value', () => {
    const store = createStore<CountState>({ count: 0 });
    const listener = vi.fn();

    store.subscribe(listener);
    store.setState({ count: 1 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 1 });
    expect(store.getState()).toEqual({ count: 1 });
  });

  it('supports updater functions that receive the previous state', () => {
    const store = createStore<CountState>({ count: 1 });
    const listener = vi.fn();

    store.subscribe(listener);
    store.setState((prev) => ({ count: prev.count + 1 }));

    expect(listener).toHaveBeenCalledWith({ count: 2 });
    expect(store.getState()).toEqual({ count: 2 });
  });

  it('stops notifying a listener after unsubscribe is called', () => {
    const store = createStore<CountState>({ count: 0 });
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.setState({ count: 1 });

    expect(listener).not.toHaveBeenCalled();
    expect(store.getState()).toEqual({ count: 1 });
  });

  it('does not notify listeners after dispose clears them', () => {
    const store = createStore<CountState>({ count: 0 });
    const listener = vi.fn();

    store.subscribe(listener);
    store.dispose();
    store.setState({ count: 1 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('provides get and set aliases for backwards compatibility', () => {
    const store = createStore<CountState>({ count: 5 });
    const listener = vi.fn();

    expect(store.get()).toEqual({ count: 5 });

    store.subscribe(listener);
    store.set({ count: 10 });

    expect(store.get()).toEqual({ count: 10 });
    expect(store.getState()).toEqual({ count: 10 });
    expect(listener).toHaveBeenCalledWith({ count: 10 });

    store.set((prev) => ({ count: prev.count + 5 }));
    expect(store.get()).toEqual({ count: 15 });
  });
});

