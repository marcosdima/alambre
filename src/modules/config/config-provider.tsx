import type { ActionTypes } from '../../types';
import createModuleProvider from '../module-provider';
import ConfigModule from './config-module';
import type { ConfigState, UseConfigType } from './config-types';

const createConfigProvider = <T extends Record<string, string>>(
  baseConfig: T,
  storage: ActionTypes.Storage,
) => {
  const {
    Provider,
    useValue,
  } = createModuleProvider<ConfigState<T>, ConfigModule<T>, UseConfigType<T>>({
    createModule: () => new ConfigModule(baseConfig, storage),
    mapContextValue: (module, state) => ({
      config: state.config,
      saveField: module.saveField.bind(module),
    }),
    missingProviderError: 'useConfig must be used within ConfigProvider',
  });

  return {
    ConfigProvider: Provider,
    useConfig: useValue,
  };
};

export default createConfigProvider;
