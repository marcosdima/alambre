import type { Storage } from '../../types/actions';
import createStore from '../../core/create-store';
import { useExternalStore } from '../../core/use-external-store';
import type { ThemeName, ThemeState, UseLightDarkType } from './light-dark-types';

const lightDarkThemeKey = 'lightDarkThemeKey';

type LightDarkActions = {
  setThemeName: (theme: ThemeName) => Promise<void>;
};

const createLightDark = <T extends object>(
  lightTheme: T,
  darkTheme: T,
  storage: Storage,
) => {
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

  // Run hydration
  void hydrate();

  const useLightDark = (): UseLightDarkType<T> => {
    const state = useExternalStore(store, (s) => s);
    return {
      theme: state.themeName === 'light' ? lightTheme : darkTheme,
      toggleTheme: async () => {
        const next: ThemeName = state.themeName === 'light' ? 'dark' : 'light';
        await setThemeName(next);
      },
      setThemeName,
      currThemeName: state.themeName,
    };
  };

  const actions = {
    setThemeName,
    toggleTheme: async () => {
      const state = store.getState();
      const next: ThemeName = state.themeName === 'light' ? 'dark' : 'light';
      await setThemeName(next);
    },
    getThemeName: () => store.getState().themeName,
    getTheme: () => store.getState().themeName === 'light' ? lightTheme : darkTheme,
  };

  return {
    store,
    actions,
    useLightDark,
  };
};

export default createLightDark;
