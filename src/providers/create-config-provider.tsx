import { createContext, useContext, useEffect, useState } from 'react';
import { DefaultReact, ActionTypes } from '@types';

const createConfigProvider = <T extends Record<string, string>>(
  baseConfig: T,
  storage: ActionTypes.Storage,
) => {
  type UseConfigType = {
    config: T;
    saveField: (field: keyof T, value: string) => Promise<void>;
  };

  const ConfigContext = createContext<UseConfigType | undefined>(undefined);

  const useConfigContext = (
    baseConfig: T,
    storage: ActionTypes.Storage,
  ): UseConfigType => {
    const [config, setConfig] = useState<T>(baseConfig);

    useEffect(() => {
      (async () => {
        const newConfig = { ...baseConfig };
        for (const key of Object.keys(baseConfig) as (keyof T)[]) {
          const saved = await storage.get(key as string);
          newConfig[key] = (saved ?? baseConfig[key]) as T[keyof T];
        }
        setConfig(newConfig);
      })();
    }, []);

    const setField = (field: keyof T, value: string) => {
      setConfig(prev => ({ ...prev, [field]: value }));
    };

    const saveField = async (field: keyof T, value: string) => {
      setField(field, value);
      await storage.set(field as string, value);
    };

    return { config, saveField };
  };

  const ConfigProvider = ({ children, ...props }: DefaultReact.ViewProps) => {
    const value = useConfigContext(baseConfig, storage);
    return (
      <ConfigContext.Provider {...props} value={value}>
        {children}
      </ConfigContext.Provider>
    );
  };

  const useConfig = () => {
    const ctx = useContext(ConfigContext);
    if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
    return ctx;
  };

  return { ConfigProvider, useConfig };
};

export default createConfigProvider;