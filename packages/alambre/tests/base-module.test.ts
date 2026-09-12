import { describe, expect, it, vi } from 'vitest';
import BaseModule from '../src/modules/base-module';

type CountState = { count: number };

class TestModule extends BaseModule<CountState> {
  initCalls = 0;

  async init() {
    this.initCalls += 1;
  }

  update(next: CountState | ((prev: CountState) => CountState)) {
    this.setState(next);
  }
}

describe('BaseModule', () => {
  it('exposes the initial state through getState', () => {
    const module = new TestModule({ count: 0 });
    expect(module.getState()).toEqual({ count: 0 });
  });

  it('notifies listeners when the state changes to a new value', () => {
    const module = new TestModule({ count: 0 });
    const listener = vi.fn();

    module.subscribe(listener);
    module.update({ count: 1 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 1 });
    expect(module.getState()).toEqual({ count: 1 });
  });

  it('supports updater functions that receive the previous state', () => {
    const module = new TestModule({ count: 1 });
    const listener = vi.fn();

    module.subscribe(listener);
    module.update((prev) => ({ count: prev.count + 1 }));

    expect(listener).toHaveBeenCalledWith({ count: 2 });
    expect(module.getState()).toEqual({ count: 2 });
  });

  it('stops notifying a listener after unsubscribe is called', () => {
    const module = new TestModule({ count: 0 });
    const listener = vi.fn();

    const unsubscribe = module.subscribe(listener);
    unsubscribe();
    module.update({ count: 1 });

    expect(listener).not.toHaveBeenCalled();
    expect(module.getState()).toEqual({ count: 1 });
  });

  it('does not notify listeners after dispose clears them', () => {
    const module = new TestModule({ count: 0 });
    const listener = vi.fn();

    module.subscribe(listener);
    module.dispose();
    module.update({ count: 1 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('resolves init by default and allows subclasses to override it', async () => {
    const module = new TestModule({ count: 0 });

    await module.init();

    expect(module.initCalls).toBe(1);
  });
});
