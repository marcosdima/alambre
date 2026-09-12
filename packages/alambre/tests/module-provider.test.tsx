import { act, render, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import BaseModule from '../src/modules/base-module';
import createModuleProvider from '../src/modules/module-provider';

type CountState = { count: number };

class CountModule extends BaseModule<CountState> {
  initCalls = 0;
  disposeCalls = 0;

  constructor() {
    super({ count: 0 });
  }

  async init() {
    this.initCalls += 1;
  }

  dispose() {
    this.disposeCalls += 1;
    super.dispose();
  }

  increment() {
    this.setState((prev) => ({ count: prev.count + 1 }));
  }
}

type CountContext = {
  count: number;
  increment: () => void;
};

describe('createModuleProvider', () => {
  it('creates the module once and exposes the mapped context value', async () => {
    let created = 0;
    const moduleHolder: { current?: CountModule } = {};

    const { Provider, useValue } = createModuleProvider<CountState, CountModule, CountContext>({
      createModule: () => {
        created += 1;
        const module = new CountModule();
        moduleHolder.current = module;
        return module;
      },
      mapContextValue: (mod, state) => ({ count: state.count, increment: mod.increment.bind(mod) }),
      missingProviderError: 'useCount must be used within CountProvider',
    });

    const valueHolder: { current?: CountContext } = {};
    const Consumer = () => {
      valueHolder.current = useValue();
      return null;
    };

    render(<Provider><Consumer /></Provider>);

    expect(created).toBe(1);
    await waitFor(() => expect(moduleHolder.current?.initCalls).toBe(1));
    expect(valueHolder.current?.count).toBe(0);

    await act(async () => {
      valueHolder.current?.increment();
    });

    await waitFor(() => expect(valueHolder.current?.count).toBe(1));
    expect(moduleHolder.current?.getState()).toEqual({ count: 1 });
  });

  it('unsubscribes and disposes the module when the provider unmounts', async () => {
    const moduleHolder: { current?: CountModule } = {};
    const { Provider, useValue } = createModuleProvider<CountState, CountModule, CountContext>({
      createModule: () => {
        const module = new CountModule();
        moduleHolder.current = module;
        return module;
      },
      mapContextValue: (mod, state) => ({ count: state.count, increment: mod.increment.bind(mod) }),
      missingProviderError: 'useCount must be used within CountProvider',
    });

    const valueHolder: { current?: CountContext } = {};
    const Consumer = () => {
      valueHolder.current = useValue();
      return null;
    };

    const tree = render(<Provider><Consumer /></Provider>);

    await waitFor(() => expect(moduleHolder.current?.initCalls).toBe(1));

    tree.unmount();

    expect(moduleHolder.current?.disposeCalls).toBe(1);
    expect(valueHolder.current?.count).toBe(0);
  });

  it('throws the missing provider error when the hook is used outside the provider', () => {
    const { useValue } = createModuleProvider<CountState, CountModule, CountContext>({
      createModule: () => new CountModule(),
      mapContextValue: (mod, state) => ({ count: state.count, increment: mod.increment.bind(mod) }),
      missingProviderError: 'useCount must be used within CountProvider',
    });

    const Consumer = () => {
      useValue();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow(/useCount must be used within CountProvider/);
  });

  it('creates a fresh module per provider mount', () => {
    const created: CountModule[] = [];

    const { Provider, useValue } = createModuleProvider<CountState, CountModule, CountContext>({
      createModule: () => {
        const module = new CountModule();
        created.push(module);
        return module;
      },
      mapContextValue: (mod, state) => ({ count: state.count, increment: mod.increment.bind(mod) }),
      missingProviderError: 'useCount must be used within CountProvider',
    });

    const Consumer = () => {
      useValue();
      return null;
    };

    render(<Provider><Consumer /></Provider>);
    render(<Provider><Consumer /></Provider>);

    expect(created).toHaveLength(2);
    expect(created[0]).not.toBe(created[1]);
  });

  it('initializes the module twice under StrictMode in the development React build and keeps working', async () => {
    let created = 0;
    const moduleHolder: { current?: CountModule } = {};

    const { Provider, useValue } = createModuleProvider<CountState, CountModule, CountContext>({
      createModule: () => {
        created += 1;
        const module = new CountModule();
        moduleHolder.current = module;
        return module;
      },
      mapContextValue: (mod, state) => ({ count: state.count, increment: mod.increment.bind(mod) }),
      missingProviderError: 'useCount must be used within CountProvider',
    });

    const valueHolder: { current?: CountContext } = {};
    const Consumer = () => {
      valueHolder.current = useValue();
      return null;
    };

    // React.StrictMode re-runs effects once (setup -> cleanup -> setup) in the
    // development React build that vitest resolves. This test documents the
    // provider behavior under that strict lifecycle: the module instance is
    // created once, init runs twice, dispose runs once, and the provider keeps
    // working because the second effect subscribes again.
    render(
      <StrictMode>
        <Provider><Consumer /></Provider>
      </StrictMode>,
    );

    expect(created).toBe(1);
    await waitFor(() => expect(moduleHolder.current?.initCalls).toBe(2));
    expect(moduleHolder.current?.disposeCalls).toBe(1);

    await act(async () => {
      valueHolder.current?.increment();
    });

    await waitFor(() => expect(valueHolder.current?.count).toBe(1));
    expect(moduleHolder.current?.getState()).toEqual({ count: 1 });
  });
});
