import type { Storage } from '../../types/actions';
import createProvider from '../../core/create-provider';
import createStore from '../../core/create-store';
import type { ThemeName, ThemeState, UseLightDarkType } from './light-dark-types';

const lightDarkThemeKey = 'lightDarkThemeKey';

type LightDarkActions = {
  setThemeName: (theme: ThemeName) => Promise<void>;
};

const createLightDarkProvider = <T extends object>(
  lightTheme: T,
  darkTheme: T,
  storage: Storage,
) => {
  const { Provider, useValue } = createProvider<ThemeState, LightDarkActions, UseLightDarkType<T>>({
    setup: () => {
      const store = createStore<ThemeState>({ themeName: 'light' });

      const setThemeName = async (themeName: ThemeName) => {
        store.setState({ themeName });
        await storage.set(lightDarkThemeKey, themeName);
      };

      const hydrate = async () => {
        const stored = await storage.get(lightDarkThemeKey);
        if (stored === 'dark' || stored === 'light') {
          store.setState({ themeName: stored });
        }
      };

      return { store, actions: { setThemeName }, hydrate };
    },
    mapValue: (state, { setThemeName }) => ({
      theme: state.themeName === 'light' ? lightTheme : darkTheme,
      toggleTheme: async () => {
        const next: ThemeName = state.themeName === 'light' ? 'dark' : 'light';
        await setThemeName(next);
      },
      setThemeName,
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
