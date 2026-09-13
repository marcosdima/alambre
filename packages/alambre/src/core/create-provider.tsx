import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { DefaultReact } from '../types';
import type { Store } from './create-store';

export type CreateProviderSetup<TState, TActions> = {
  store: Store<TState>;
  actions: TActions;
  hydrate?: () => Promise<void>;
  dispose?: () => void;
};

export type CreateProviderOptions<TState, TActions, TContextValue> = {
  setup: () => CreateProviderSetup<TState, TActions>;
  mapValue: (state: TState, actions: TActions) => TContextValue;
  missingProviderError: string;
};

export default <TState, TActions, TContextValue>(
  {
    setup,
    mapValue,
    missingProviderError,
  }: CreateProviderOptions<TState, TActions, TContextValue>,
) => {
  const Context = createContext<TContextValue | undefined>(undefined);

  const Provider = ({ children, ...props }: DefaultReact.ViewProps) => {
    const setupRef = useRef<CreateProviderSetup<TState, TActions> | null>(null);

    if (!setupRef.current) {
      setupRef.current = setup();
    }

    const { store, actions, hydrate, dispose } = setupRef.current;
    const [state, setState] = useState<TState>(store.getState());

    useEffect(() => {
      const unsubscribe = store.subscribe(setState);

      if (hydrate) {
        void hydrate();
      }

      return () => {
        unsubscribe();
        store.dispose();
        dispose?.();
      };
    }, [store, hydrate, dispose]);

    const value = useMemo(
      () => mapValue(state, actions),
      [state, actions],
    );

    return (
      <Context.Provider {...props} value={value}>
        {children}
      </Context.Provider>
    );
  };

  const useValue = () => {
    const ctx = useContext(Context);
    if (!ctx) throw new Error(missingProviderError);
    return ctx;
  };

  return {
    Provider,
    useValue,
  };
};
