import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { DefaultReact } from '../types';
import type BaseModule from './base-module';

type CreateModuleProviderOptions<TState, TModule extends BaseModule<TState>, TContextValue> = {
  createModule: () => TModule;
  mapContextValue: (module: TModule, state: TState) => TContextValue;
  missingProviderError: string;
};

export default <TState, TModule extends BaseModule<TState>, TContextValue>(
  {
    createModule,
    mapContextValue,
    missingProviderError,
  }: CreateModuleProviderOptions<TState, TModule, TContextValue>,
) => {
  // Create a typed context that will expose mapped module values.
  const Context = createContext<TContextValue | undefined>(undefined);

  const Provider = ({ children, ...props }: DefaultReact.ViewProps) => {
    // Keep a single module instance for the full provider lifecycle.
    const moduleRef = useRef<TModule | null>(null);

    if (!moduleRef.current) {
      moduleRef.current = createModule();
    }

    const module = moduleRef.current;
    // Mirror module state into React state to trigger re-renders.
    const [state, setState] = useState<TState>(module.getState());

    useEffect(() => {
      // Subscribe on mount and keep React state in sync.
      const unsubscribe = module.subscribe(setState);

      // Start module async bootstrapping after first render.
      void module.init();

      return () => {
        // Unsubscribe and dispose module resources on unmount.
        unsubscribe();
        module.dispose();
      };
    }, [module]);

    // Map internal module state to the public context contract.
    const value = useMemo(
      () => mapContextValue(module, state),
      [module, state],
    );

    return (
      <Context.Provider {...props} value={value}>
        {children}
      </Context.Provider>
    );
  };

  const useValue = () => {
    // Guard hook usage outside of provider boundaries.
    const ctx = useContext(Context);
    if (!ctx) throw new Error(missingProviderError);
    return ctx;
  };

  return {
    Provider,
    useValue,
  };
};
