import type { Storage } from '../../types/actions';
import createProvider from '../../core/create-provider';
import createStore from '../../core/create-store';
import type { ConfigState, UseConfigType } from './config-types';

type ConfigActions<T extends Record<string, string>> = {
  saveField: (field: keyof T, value: string) => Promise<void>;
};

const createConfigProvider = <T extends Record<string, string>>(
  baseConfig: T,
  storage: Storage,
) => {
  const { Provider, useValue } = createProvider<ConfigState<T>, ConfigActions<T>, UseConfigType<T>>({
    setup: () => {
      const store = createStore<ConfigState<T>>({ config: baseConfig });

      const saveField = async (field: keyof T, value: string) => {
        store.setState((prev) => ({
          config: {
            ...prev.config,
            [field]: value,
          },
        }));

        await storage.set(field as string, value);
      };

      const hydrate = async () => {
        const nextConfig = { ...baseConfig };

        for (const key of Object.keys(baseConfig) as (keyof T)[]) {
          const saved = await storage.get(key as string);
          nextConfig[key] = (saved ?? baseConfig[key]) as T[keyof T];
        }

        store.setState({ config: nextConfig });
      };

      return { store, actions: { saveField }, hydrate };
    },
    mapValue: (state, { saveField }) => ({
      config: state.config,
      saveField,
    }),
    missingProviderError: 'useConfig must be used within ConfigProvider',
  });

  return {
    ConfigProvider: Provider,
    useConfig: useValue,
  };
};

export default createConfigProvider;
