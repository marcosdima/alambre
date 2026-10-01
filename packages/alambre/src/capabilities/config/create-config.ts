import type { FC, ReactNode, ReactElement } from 'react';
import type { Storage } from '../../types/actions';
import createStore from '../../core/create-store';
import { useExternalStore } from '../../core/use-external-store';
import type { ConfigState, UseConfigType } from './config-types';

const ConfigProvider: FC<{ children?: ReactNode }> = ({ children }) => (children ?? null) as ReactElement | null;

const serializeConfigValue = (value: unknown): string => (
  typeof value === 'string' ? value : JSON.stringify(value)
);

const parseConfigValue = <V>(raw: string | null, fallback: V): V => {
  if (raw === null || raw === undefined) return fallback;
  if (typeof fallback === 'string') return raw as unknown as V;
  try {
    return JSON.parse(raw) as V;
  } catch {
    return (typeof fallback === 'undefined' ? raw : fallback) as V;
  }
};

const createConfig = <T extends Record<string, unknown>>(
  baseConfig: T,
  storage: Storage,
) => {
  const store = createStore<ConfigState<T>>({ config: baseConfig, loading: true });

  const saveField = async <K extends keyof T>(field: K, value: T[K]) => {
    store.setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value,
      },
    }));

    await storage.set(field as string, serializeConfigValue(value));
  };

  const hydrate = async () => {
    try {
      const nextConfig = { ...baseConfig };

      for (const key of Object.keys(baseConfig) as (keyof T)[]) {
        const saved = await storage.get(key as string);
        nextConfig[key] = parseConfigValue(saved, baseConfig[key]);
      }

      store.setState({ config: nextConfig, loading: false });
    } catch {
      store.setState((prev) => ({ ...prev, loading: false }));
    }
  };

  void hydrate();

  const useConfig = (): UseConfigType<T> => {
    const state = useExternalStore(store, (s) => s);
    return {
      config: state.config,
      loading: state.loading,
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
