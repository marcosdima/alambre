import { act, render, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import createProvider from '../../src/core/create-provider';
import createStore, { type Store } from '../../src/core/create-store';

type CountState = { count: number };

type CountContext = {
  count: number;
  increment: () => void;
};

const countActions = (store: Store<CountState>) => ({
  increment: () => store.setState((prev) => ({ count: prev.count + 1 })),
});

describe('createProvider', () => {
  it('sets up the store once and exposes the mapped context value', async () => {
    let setups = 0;
    const hydrateCalls = { count: 0 };
    const storeHolder: { current?: Store<CountState> } = {};

    const { Provider, useValue } = createProvider<CountState, { increment: () => void }, CountContext>({
      setup: () => {
        setups += 1;
        const store = createStore<CountState>({ count: 0 });
        storeHolder.current = store;

        return {
          store,
          actions: countActions(store),
          hydrate: async () => {
            hydrateCalls.count += 1;
          },
        };
      },
      mapValue: (state, { increment }) => ({ count: state.count, increment }),
      missingProviderError: 'useCount must be used within CountProvider',
    });

    const valueHolder: { current?: CountContext } = {};
    const Consumer = () => {
      valueHolder.current = useValue();
      return null;
    };

    render(<Provider><Consumer /></Provider>);

    expect(setups).toBe(1);
    await waitFor(() => expect(hydrateCalls.count).toBe(1));
    expect(valueHolder.current?.count).toBe(0);

    await act(async () => {
      valueHolder.current?.increment();
    });

    await waitFor(() => expect(valueHolder.current?.count).toBe(1));
    expect(storeHolder.current?.getState()).toEqual({ count: 1 });
  });

  it('unsubscribes and disposes the store when the provider unmounts', async () => {
    const disposeCalls = { count: 0 };
    const { Provider, useValue } = createProvider<CountState, { increment: () => void }, CountContext>({
      setup: () => {
        const store = createStore<CountState>({ count: 0 });
        return {
          store,
          actions: countActions(store),
          hydrate: async () => undefined,
          dispose: () => {
            disposeCalls.count += 1;
          },
        };
      },
      mapValue: (state, { increment }) => ({ count: state.count, increment }),
      missingProviderError: 'useCount must be used within CountProvider',
    });

    const valueHolder: { current?: CountContext } = {};
    const Consumer = () => {
      valueHolder.current = useValue();
      return null;
    };

    const tree = render(<Provider><Consumer /></Provider>);

    await waitFor(() => expect(valueHolder.current?.count).toBe(0));

    tree.unmount();

    expect(disposeCalls.count).toBe(1);
    expect(valueHolder.current?.count).toBe(0);
  });

  it('throws the missing provider error when the hook is used outside the provider', () => {
    const { useValue } = createProvider<CountState, { increment: () => void }, CountContext>({
      setup: () => {
        const store = createStore<CountState>({ count: 0 });
        return { store, actions: countActions(store) };
      },
      mapValue: (state, { increment }) => ({ count: state.count, increment }),
      missingProviderError: 'useCount must be used within CountProvider',
    });

    const Consumer = () => {
      useValue();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow(/useCount must be used within CountProvider/);
  });

  it('creates a fresh store per provider mount', () => {
    const stores: Store<CountState>[] = [];

    const { Provider, useValue } = createProvider<CountState, { increment: () => void }, CountContext>({
      setup: () => {
        const store = createStore<CountState>({ count: 0 });
        stores.push(store);
        return { store, actions: countActions(store) };
      },
      mapValue: (state, { increment }) => ({ count: state.count, increment }),
      missingProviderError: 'useCount must be used within CountProvider',
    });

    const Consumer = () => {
      useValue();
      return null;
    };

    render(<Provider><Consumer /></Provider>);
    render(<Provider><Consumer /></Provider>);

    expect(stores).toHaveLength(2);
    expect(stores[0]).not.toBe(stores[1]);
  });

  it('runs hydrate twice under StrictMode in the development React build and keeps working', async () => {
    let setups = 0;
    const hydrateCalls = { count: 0 };
    const disposeCalls = { count: 0 };
    const storeHolder: { current?: Store<CountState> } = {};

    const { Provider, useValue } = createProvider<CountState, { increment: () => void }, CountContext>({
      setup: () => {
        setups += 1;
        const store = createStore<CountState>({ count: 0 });
        storeHolder.current = store;

        return {
          store,
          actions: countActions(store),
          hydrate: async () => {
            hydrateCalls.count += 1;
          },
          dispose: () => {
            disposeCalls.count += 1;
          },
        };
      },
      mapValue: (state, { increment }) => ({ count: state.count, increment }),
      missingProviderError: 'useCount must be used within CountProvider',
    });

    const valueHolder: { current?: CountContext } = {};
    const Consumer = () => {
      valueHolder.current = useValue();
      return null;
    };

    render(
      <StrictMode>
        <Provider><Consumer /></Provider>
      </StrictMode>,
    );

    expect(setups).toBe(1);
    await waitFor(() => expect(hydrateCalls.count).toBe(2));
    expect(disposeCalls.count).toBe(1);

    await act(async () => {
      valueHolder.current?.increment();
    });

    await waitFor(() => expect(valueHolder.current?.count).toBe(1));
    expect(storeHolder.current?.getState()).toEqual({ count: 1 });
  });
});
