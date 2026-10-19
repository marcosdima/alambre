import React, { createContext, useContext, useMemo } from 'react';
import type { ThemeTokens } from './tokens';
import { defaultLightTheme } from './tokens';

const ThemeContext = createContext<ThemeTokens>(defaultLightTheme);

export interface ThemeProviderProps {
  theme?: Partial<ThemeTokens>;
  children?: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const mergedTheme = useMemo<ThemeTokens>(
    () => (theme ? { ...defaultLightTheme, ...theme } : defaultLightTheme),
    [theme],
  );
  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): { theme: ThemeTokens } {
  const theme = useContext(ThemeContext);
  return { theme };
}

