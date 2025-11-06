import { createContext, useContext, useState, useEffect } from 'react';
import { DefaultReact, ActionTypes } from '@types';

const lightDarkThemeKey = 'lightDarkThemeKey';

type ThemeName = 'light' | 'dark';

const useThemeContext = <T extends object>(
  {
    lightTheme,
    darkTheme,
    storage,
  }: {
    lightTheme: T;
    darkTheme: T;
    storage: ActionTypes.Storage;
  }
) => {
  const [themeName, setThemeName] = useState<ThemeName>('light');

  useEffect(() => {
    (async () => {
      const stored = await storage.get(lightDarkThemeKey);
      if (stored === 'dark' || stored === 'light') setThemeName(stored);
    })();
  }, []);

  const toggleTheme = async () => {
    const next = themeName === 'light' ? 'dark' : 'light';
    setThemeName(next);
    await storage.set(lightDarkThemeKey, next);
  };

  const theme = themeName === 'light' ? lightTheme : darkTheme;

  return {
    theme,
    toggleTheme,
    setThemeName,
  };
};

export const createLightDarkContext = <T extends object>(
  lightTheme: T,
  darkTheme: T,
  storage: ActionTypes.Storage,
) => {
  const LightDarkContext = createContext<
    | {
        theme: T;
        toggleTheme: () => void;
        setThemeName: (theme: ThemeName) => void;
      }
    | undefined
  >(undefined);

  const LightDarkProvider = ({ children, ...props}: DefaultReact.ViewProps) => {
    const value = useThemeContext<T>({ lightTheme, darkTheme, storage });
    return (
      <LightDarkContext.Provider {...props} value={value}>
        {children}
      </LightDarkContext.Provider>
    );
  };

  const useLightDark = () => {
    const ctx = useContext(LightDarkContext);
    if (!ctx)
      throw new Error('useLightDark must be used within a LightDarkProvider');
    return ctx;
  };

  return { LightDarkProvider, useLightDark };
};
