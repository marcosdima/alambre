import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import createStore from '../../src/core/create-store';
import { useExternalStore } from '../../src/core/use-external-store';

type State = {
  count: number;
  text: string;
};

describe('useExternalStore', () => {
  it('reads initial state via the selector', () => {
    const store = createStore<State>({ count: 42, text: 'hello' });
    let selected: number | undefined;

    const Component = () => {
      selected = useExternalStore(store, (s) => s.count);
      return null;
    };

    render(<Component />);

    expect(selected).toBe(42);
  });

  it('updates when the selected slice changes', () => {
    const store = createStore<State>({ count: 0, text: 'hello' });
    let selected: number | undefined;

    const Component = () => {
      selected = useExternalStore(store, (s) => s.count);
      return null;
    };

    render(<Component />);
    expect(selected).toBe(0);

    act(() => {
      store.setState((prev) => ({ ...prev, count: 5 }));
    });

    expect(selected).toBe(5);
  });

  it('does not re-render if the selected value is unchanged', () => {
    const store = createStore<State>({ count: 10, text: 'init' });
    let renderCount = 0;

    const Component = () => {
      renderCount += 1;
      useExternalStore(store, (s) => s.count);
      return null;
    };

    render(<Component />);
    expect(renderCount).toBe(1);

    act(() => {
      store.setState((prev) => ({ ...prev, text: 'changed' }));
    });

    expect(renderCount).toBe(1);
  });

  it('unsubscribes from the store on unmount', () => {
    const store = createStore<State>({ count: 0, text: '' });
    const subscribeSpy = vi.spyOn(store, 'subscribe');

    const Component = () => {
      useExternalStore(store, (s) => s.count);
      return null;
    };

    const { unmount } = render(<Component />);
    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      store.setState({ count: 99, text: 'unmounted' });
    });
  });
});
