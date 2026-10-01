import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import createLightDark from '../../src/capabilities/light-dark/create-light-dark';
import type { UseLightDarkType } from '../../src/capabilities/light-dark/light-dark-types';
import { createMemoryStorage, type StorageMock } from '../helpers/storage';

type Theme = { color: string };

const light: Theme = { color: '#ffffff' };
const dark: Theme = { color: '#000000' };

describe('createLightDark', () => {
  it('starts in light mode with the light theme by default', async () => {
    const storage = createMemoryStorage();
    const { useLightDark } = createLightDark(light, dark, storage);

    const holder: { current?: UseLightDarkType<Theme> } = {};
    const Consumer = () => {
      holder.current = useLightDark();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current).toBeDefined());
    expect(holder.current?.currThemeName).toBe('light');
    expect(holder.current?.theme).toEqual(light);
  });

  it('loads a persisted dark preference on init', async () => {
    const storage = createMemoryStorage({ lightDarkThemeKey: 'dark' });
    const { useLightDark } = createLightDark(light, dark, storage);

    const holder: { current?: UseLightDarkType<Theme> } = {};
    const Consumer = () => {
      holder.current = useLightDark();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.currThemeName).toBe('dark'));
    expect(holder.current?.theme).toEqual(dark);
    expect(storage.getCalls).toContain('lightDarkThemeKey');
  });

  it('ignores an invalid persisted theme name', async () => {
    const storage = createMemoryStorage({ lightDarkThemeKey: 'blue' });
    const { useLightDark } = createLightDark(light, dark, storage);

    const holder: { current?: UseLightDarkType<Theme> } = {};
    const Consumer = () => {
      holder.current = useLightDark();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.currThemeName).toBe('light'));
    expect(holder.current?.theme).toEqual(light);
  });

  it('toggles to dark and persists the choice', async () => {
    const storage: StorageMock = createMemoryStorage();
    const { useLightDark } = createLightDark(light, dark, storage);

    const holder: { current?: UseLightDarkType<Theme> } = {};
    const Consumer = () => {
      holder.current = useLightDark();
      return null;
    };

    render(<Consumer />);

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
    const { useLightDark } = createLightDark(light, dark, storage);

    const holder: { current?: UseLightDarkType<Theme> } = {};
    const Consumer = () => {
      holder.current = useLightDark();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current).toBeDefined());

    await act(async () => {
      await holder.current!.setThemeName('dark');
    });

    await waitFor(() => expect(holder.current?.currThemeName).toBe('dark'));
    expect(storage.setCalls).toContainEqual(['lightDarkThemeKey', 'dark']);
  });

  it('can be accessed directly via actions and store without React render', async () => {
    const storage = createMemoryStorage();
    const { store, actions } = createLightDark(light, dark, storage);

    await waitFor(() => expect(store.getState().themeName).toBe('light'));

    await actions.toggleTheme();

    expect(actions.getThemeName()).toBe('dark');
    expect(actions.getTheme()).toEqual(dark);
    expect(storage.setCalls).toContainEqual(['lightDarkThemeKey', 'dark']);
  });
});
