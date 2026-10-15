import React, { createContext, useContext } from 'react';
import type { ThemeTokens } from './tokens';
import { defaultLightTheme } from './tokens';

const ThemeContext = createContext<ThemeTokens>(defaultLightTheme);

export interface ThemeProviderProps {
  theme?: ThemeTokens;
  children?: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme || defaultLightTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): { theme: ThemeTokens } {
  const theme = useContext(ThemeContext);
  return { theme };
}

