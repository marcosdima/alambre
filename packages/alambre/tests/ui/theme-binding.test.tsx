import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  useTheme,
  ThemeProvider,
  bindThemeStore,
  unbindThemeStore,
  getBoundThemeStore,
  defaultLightTheme,
  defaultDarkTheme,
} from '../../src/ui/theme';
import createStore from '../../src/core/create-store';

describe('Theme store binding & useTheme fallback', () => {
  beforeEach(() => {
    unbindThemeStore();
  });

  afterEach(() => {
    unbindThemeStore();
  });

  it('tracks globally bound theme store via getBoundThemeStore', () => {
    expect(getBoundThemeStore()).toBeNull();

    const mockStore = {
      store: createStore({ theme: 'light' }),
      actions: { getTheme: () => defaultLightTheme },
    };
    bindThemeStore(mockStore);
    expect(getBoundThemeStore()).toBe(mockStore);

    unbindThemeStore();
    expect(getBoundThemeStore()).toBeNull();
  });

  it('supports direct store contract with top-level subscribe and getTheme', () => {
    const customTheme = { ...defaultLightTheme, primary: '#123456' };
    const listeners = new Set<() => void>();
    const directStore = {
      subscribe: (l: () => void) => {
        listeners.add(l);
        return () => listeners.delete(l);
      },
      getTheme: () => customTheme,
    };

    bindThemeStore(directStore);

    let capturedTheme: any;
    const TestComponent = () => {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    };

    render(<TestComponent />);
    expect(capturedTheme.primary).toBe('#123456');
  });

  it('provides well-defined semantic soft tokens on light and dark defaults', () => {
    expect(defaultLightTheme.warningSoft).toBe('#fef3c7');
    expect(defaultLightTheme.successSoft).toBe('#dcfce7');
    expect(defaultDarkTheme.warningSoft).toBe('#3d2e0f');
    expect(defaultDarkTheme.successSoft).toBe('#143823');
  });

  it('returns defaultLightTheme when no store is bound and no ThemeProvider is present', () => {
    let capturedTheme: any;
    const TestComponent = () => {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    };

    render(<TestComponent />);
    expect(capturedTheme).toBeDefined();
    expect(capturedTheme.primary).toBe(defaultLightTheme.primary);
    expect(capturedTheme.color).toBe(defaultLightTheme.color);
  });

  it('binds to an external theme store and updates when the store changes', () => {
    const customLight = { ...defaultLightTheme, primary: '#00aa00' };
    const customDark = { ...defaultLightTheme, primary: '#aa0000' };

    const store = createStore<{ themeName: 'light' | 'dark' }>({ themeName: 'light' });
    const mockThemeStore = {
      store,
      actions: {
        getTheme: () => (store.getState().themeName === 'light' ? customLight : customDark),
      },
    };

    bindThemeStore(mockThemeStore);

    let capturedTheme: any;
    const TestComponent = () => {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    };

    render(<TestComponent />);
    expect(capturedTheme.primary).toBe('#00aa00');

    act(() => {
      store.setState({ themeName: 'dark' });
    });
    expect(capturedTheme.primary).toBe('#aa0000');
  });

  it('ThemeProvider context takes precedence over boundThemeStore', () => {
    const storeTheme = { ...defaultLightTheme, primary: '#store-color' };
    const store = createStore<{ themeName: 'light' }>({ themeName: 'light' });
    const mockThemeStore = {
      store,
      actions: {
        getTheme: () => storeTheme,
      },
    };
    bindThemeStore(mockThemeStore);

    let capturedTheme: any;
    const TestComponent = () => {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    };

    render(
      <ThemeProvider theme={{ primary: '#context-color' }}>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(capturedTheme.primary).toBe('#context-color');
  });

  it('unbindThemeStore resets theme back to default', () => {
    const tempTheme = { ...defaultLightTheme, primary: '#temp-color' };
    const store = createStore<{ themeName: 'light' }>({ themeName: 'light' });
    bindThemeStore({
      store,
      actions: { getTheme: () => tempTheme },
    });

    unbindThemeStore();

    let capturedTheme: any;
    const TestComponent = () => {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    };

    render(<TestComponent />);
    expect(capturedTheme.primary).toBe(defaultLightTheme.primary);
  });
});

