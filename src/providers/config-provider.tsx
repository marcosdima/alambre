import { createContext, ReactNode, useContext } from 'react';
import { useEffect, useState } from 'react';
import { ViewProps } from '../types/default-react';

type Config = {
  [key: string]: string;
};

type UseConfigType = {
  config: Config,
  saveField: (field: string, value: string) => Promise<void>,
}

type Storage = {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
}

const useConfigContext = (baseConfig: Config, storage: Storage) => {
  const [config, setConfig] = useState<Config>({});

  useEffect(() => {
    (async () => {
      const newConfig = { ...config };
      for (const key of Object.keys(baseConfig)) {
        const saved = await storage.get(key);
        newConfig[key] = saved ?? baseConfig[key];
      }
      setConfig(newConfig);
    })();
  }, []);

  const setField = (field: string, value: string) => setConfig({ ...config, [field]: value });

  const saveField = async (field: string, value: string) => {
    const fieldConfig = config[field];
    if (fieldConfig === undefined) throw new Error(`Field ${field} not found in config`);
    setField(field, value);
    await storage.set(field, value);
  };

  return {
    config,
    saveField,
  };
};

const ConfigContext = createContext<UseConfigType | undefined>(undefined);

type ConfigProviderProps = {
	baseConfig: Config;
	storage: Storage;
	children: ReactNode;
} & ViewProps;

export const ConfigProvider = ({ storage, baseConfig, children, ...props }: ConfigProviderProps) => {
  const value = useConfigContext(baseConfig, storage);
  return <ConfigContext.Provider {...props} value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfigContext must be used within ConfigProvider');
  return ctx;
};