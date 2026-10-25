import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import type { ThemeTokens } from './tokens';
import { defaultLightTheme } from './tokens';

const ThemeContext = createContext<ThemeTokens | null>(null);

export type ThemeStoreLike = {
  store?: {
    getState: () => unknown;
    subscribe: (listener: () => void) => () => void;
  };
  getState?: () => unknown;
  subscribe?: (listener: () => void) => () => void;
  actions?: {
    getTheme?: () => ThemeTokens;
    [key: string]: unknown;
  };
  getTheme?: () => ThemeTokens;
};

let globalBoundThemeStore: ThemeStoreLike | null = null;
const noopSubscribe = () => () => {};

/**
 * Binds an external ThemeStore (e.g. from createLightDark) globally,
 * allowing useTheme() to read and react to theme changes without
 * requiring a mandatory <ThemeProvider> wrapping in the React tree.
 */
export function bindThemeStore(themeStore: ThemeStoreLike | null) {
  globalBoundThemeStore = themeStore;
}

export function unbindThemeStore() {
  globalBoundThemeStore = null;
}

export function getBoundThemeStore(): ThemeStoreLike | null {
  return globalBoundThemeStore;
}

export interface ThemeProviderProps {
  theme?: Partial<ThemeTokens>;
  store?: ThemeStoreLike;
  children?: React.ReactNode;
}

export function ThemeProvider({ theme, store, children }: ThemeProviderProps) {
  const activeStore = store ?? (theme ? null : globalBoundThemeStore);
  const rawStore = activeStore?.store ?? (activeStore?.subscribe ? activeStore : null);
  const getter = activeStore?.actions?.getTheme ?? activeStore?.getTheme;

  const subscribeFn = typeof rawStore?.subscribe === 'function'
    ? (listener: () => void) => rawStore!.subscribe!(listener)
    : noopSubscribe;

  const storeTheme = useSyncExternalStore(
    subscribeFn,
    () => (getter ? getter() : null),
  );

  const effectiveTheme = theme ?? (storeTheme as Partial<ThemeTokens> | null);

  const mergedTheme = useMemo<ThemeTokens>(
    () => (effectiveTheme ? { ...defaultLightTheme, ...effectiveTheme } : defaultLightTheme),
    [effectiveTheme],
  );

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): { theme: ThemeTokens } {
  const contextTheme = useContext(ThemeContext);

  const rawStore = globalBoundThemeStore?.store ?? (globalBoundThemeStore?.subscribe ? globalBoundThemeStore : null);
  const getter = globalBoundThemeStore?.actions?.getTheme ?? globalBoundThemeStore?.getTheme;

  const subscribeFn = useMemo(() => {
    if (contextTheme !== null || !rawStore || typeof rawStore.subscribe !== 'function') {
      return noopSubscribe;
    }
    return (listener: () => void) => rawStore.subscribe!(listener);
  }, [contextTheme, rawStore]);

  const storeTheme = useSyncExternalStore(
    subscribeFn,
    () => (getter ? (getter() as Partial<ThemeTokens>) : null),
  );

  if (contextTheme !== null) {
    return { theme: contextTheme };
  }

  if (storeTheme) {
    return { theme: { ...defaultLightTheme, ...storeTheme } };
  }

  return { theme: defaultLightTheme };
}
