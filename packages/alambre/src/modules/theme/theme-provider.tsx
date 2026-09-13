import type { Storage } from '../../types/actions';
import createModuleProvider from '../module-provider';
import ThemeModule from './theme-module';
import type { ThemeState, UseLightDarkType } from './theme-types';

const createLightDarkProvider = <T extends object>(
  lightTheme: T,
  darkTheme: T,
  storage: Storage,
) => {
  const {
    Provider,
    useValue,
  } = createModuleProvider<ThemeState, ThemeModule<T>, UseLightDarkType<T>>({
    createModule: () => new ThemeModule(lightTheme, darkTheme, storage),
    mapContextValue: (module, state) => ({
      theme: module.getTheme(state.themeName),
      toggleTheme: module.toggleTheme.bind(module),
      setThemeName: module.setThemeName.bind(module),
      currThemeName: state.themeName,
    }),
    missingProviderError: 'useLightDark must be used within a LightDarkProvider',
  });

  return {
    LightDarkProvider: Provider,
    useLightDark: useValue,
  };
};

export default createLightDarkProvider;
