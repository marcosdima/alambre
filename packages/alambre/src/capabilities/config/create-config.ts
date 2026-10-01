import type { FC, ReactNode, ReactElement } from 'react';
import type { Storage } from '../../types/actions';
import createStore from '../../core/create-store';
import { useExternalStore } from '../../core/use-external-store';
import type { ConfigState, UseConfigType } from './config-types';

const ConfigProvider: FC<{ children?: ReactNode }> = ({ children }) => (children ?? null) as ReactElement | null;

const createConfig = <T extends Record<string, string>>(
  baseConfig: T,
  storage: Storage,
) => {
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

  void hydrate();

  const useConfig = (): UseConfigType<T> => {
    const state = useExternalStore(store, (s) => s);
    return {
      config: state.config,
      saveField,
    };
  };

  return {
    store,
    actions: { saveField },
    useConfig,
    ConfigProvider,
  };
};

export default createConfig;
