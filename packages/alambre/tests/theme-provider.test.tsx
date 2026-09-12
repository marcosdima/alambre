import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import createLightDarkProvider from '../src/modules/theme/theme-provider';
import type { UseLightDarkType } from '../src/modules/theme/theme-types';
import { createMemoryStorage, type StorageMock } from './helpers/storage';

type Theme = { color: string };

const light: Theme = { color: '#ffffff' };
const dark: Theme = { color: '#000000' };

describe('createLightDarkProvider', () => {
  it('starts in light mode with the light theme by default', async () => {
    const storage = createMemoryStorage();
    const { LightDarkProvider, useLightDark } = createLightDarkProvider(light, dark, storage);

    const holder: { current?: UseLightDarkType<Theme> } = {};
    const Consumer = () => {
      holder.current = useLightDark();
      return null;
    };

    render(<LightDarkProvider><Consumer /></LightDarkProvider>);

    await waitFor(() => expect(holder.current).toBeDefined());
    expect(holder.current?.currThemeName).toBe('light');
    expect(holder.current?.theme).toEqual(light);
  });

  it('loads a persisted dark preference on init', async () => {
    const storage = createMemoryStorage({ lightDarkThemeKey: 'dark' });
    const { LightDarkProvider, useLightDark } = createLightDarkProvider(light, dark, storage);

    const holder: { current?: UseLightDarkType<Theme> } = {};
    const Consumer = () => {
      holder.current = useLightDark();
      return null;
    };

    render(<LightDarkProvider><Consumer /></LightDarkProvider>);

    await waitFor(() => expect(holder.current?.currThemeName).toBe('dark'));
    expect(holder.current?.theme).toEqual(dark);
    expect(storage.getCalls).toContain('lightDarkThemeKey');
  });

  it('ignores an invalid persisted theme name', async () => {
    const storage = createMemoryStorage({ lightDarkThemeKey: 'blue' });
    const { LightDarkProvider, useLightDark } = createLightDarkProvider(light, dark, storage);

    const holder: { current?: UseLightDarkType<Theme> } = {};
    const Consumer = () => {
      holder.current = useLightDark();
      return null;
    };

    render(<LightDarkProvider><Consumer /></LightDarkProvider>);

    await waitFor(() => expect(holder.current?.currThemeName).toBe('light'));
    expect(holder.current?.theme).toEqual(light);
  });

  it('toggles to dark and persists the choice', async () => {
    const storage: StorageMock = createMemoryStorage();
    const { LightDarkProvider, useLightDark } = createLightDarkProvider(light, dark, storage);

    const holder: { current?: UseLightDarkType<Theme> } = {};
    const Consumer = () => {
      holder.current = useLightDark();
      return null;
    };

    render(<LightDarkProvider><Consumer /></LightDarkProvider>);

    await waitFor(() => expect(holder.current).toBeDefined());

    await act(async () => {
      await holder.current!.toggleTheme();
    });

    await waitFor(() => expect(holder.current?.currThemeName).toBe('dark'));
    expect(holder.current?.theme).toEqual(dark);
    expect(storage.setCalls).toContainEqual(['lightDarkThemeKey', 'dark']);

    await act(async () => {
      await holder.current!.toggleTheme();
    });

    await waitFor(() => expect(holder.current?.currThemeName).toBe('light'));
    expect(storage.setCalls).toContainEqual(['lightDarkThemeKey', 'light']);
  });

  it('sets the theme name explicitly and persists it', async () => {
    const storage = createMemoryStorage();
    const { LightDarkProvider, useLightDark } = createLightDarkProvider(light, dark, storage);

    const holder: { current?: UseLightDarkType<Theme> } = {};
    const Consumer = () => {
      holder.current = useLightDark();
      return null;
    };

    render(<LightDarkProvider><Consumer /></LightDarkProvider>);

    await waitFor(() => expect(holder.current).toBeDefined());

    await act(async () => {
      await holder.current!.setThemeName('dark');
    });

    await waitFor(() => expect(holder.current?.currThemeName).toBe('dark'));
    expect(storage.setCalls).toContainEqual(['lightDarkThemeKey', 'dark']);
  });

  it('throws when the hook is used outside the provider', () => {
    const storage = createMemoryStorage();
    const { useLightDark } = createLightDarkProvider(light, dark, storage);

    const Consumer = () => {
      useLightDark();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow(/useLightDark must be used within a LightDarkProvider/);
  });
});
