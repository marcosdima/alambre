import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import createLang from '../../src/capabilities/lang/create-lang';
import type { Langs, UseLangType } from '../../src/capabilities/lang/lang-types';
import { createMemoryStorage } from '../helpers/storage';

const langs: Langs = {
  en: { hello: 'Hello' },
  es: { hello: 'Hola' },
} as Langs;

describe('createLang', () => {
  it('defaults to the first language', async () => {
    const storage = createMemoryStorage();
    const { useLang } = createLang(langs, storage);

    const holder: { current?: UseLangType<typeof langs> } = {};
    const Consumer = () => {
      holder.current = useLang();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.currentLang).toBe('en'));
    expect(holder.current?.lang).toEqual(langs.en);
  });

  it('loads a persisted valid language', async () => {
    const storage = createMemoryStorage({ currentLanguage: 'es' });
    const { useLang } = createLang(langs, storage);

    const holder: { current?: UseLangType<typeof langs> } = {};
    const Consumer = () => {
      holder.current = useLang();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.currentLang).toBe('es'));
    expect(holder.current?.lang).toEqual(langs.es);
    expect(storage.getCalls).toContain('currentLanguage');
  });

  it('keeps the first language when the persisted value is not a known language', async () => {
    const storage = createMemoryStorage({ currentLanguage: 'fr' });
    const { useLang } = createLang(langs, storage);

    const holder: { current?: UseLangType<typeof langs> } = {};
    const Consumer = () => {
      holder.current = useLang();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current?.currentLang).toBe('en'));
    expect(holder.current?.lang).toEqual(langs.en);
  });

  it('changes the language and persists the new key', async () => {
    const storage = createMemoryStorage();
    const { useLang } = createLang(langs, storage);

    const holder: { current?: UseLangType<typeof langs> } = {};
    const Consumer = () => {
      holder.current = useLang();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current).toBeDefined());

    await act(async () => {
      await holder.current!.changeLang('es');
    });

    await waitFor(() => expect(holder.current?.currentLang).toBe('es'));
    expect(holder.current?.lang).toEqual(langs.es);
    expect(storage.setCalls).toContainEqual(['currentLanguage', 'es']);
  });

  it('falls back to the first language when changing to an unknown key', async () => {
    const storage = createMemoryStorage();
    const { useLang } = createLang(langs, storage);

    const holder: { current?: UseLangType<typeof langs> } = {};
    const Consumer = () => {
      holder.current = useLang();
      return null;
    };

    render(<Consumer />);

    await waitFor(() => expect(holder.current).toBeDefined());

    await act(async () => {
      await holder.current!.changeLang('fr' as keyof typeof langs);
    });

    await waitFor(() => expect(holder.current?.currentLang).toBe('en'));
    expect(holder.current?.lang).toEqual(langs.en);
    expect(storage.setCalls).toContainEqual(['currentLanguage', 'en']);
  });

  it('throws when no languages are provided', () => {
    const storage = createMemoryStorage();

    expect(() => createLang({} as Langs, storage)).toThrow(/requires at least one language/);
  });

  it('can be accessed directly via actions and store without React render', async () => {
    const storage = createMemoryStorage();
    const { store, actions } = createLang(langs, storage);

    await waitFor(() => expect(store.getState().currentLang).toBe('en'));

    await actions.changeLang('es');

    expect(store.getState().currentLang).toBe('es');
    expect(storage.setCalls).toContainEqual(['currentLanguage', 'es']);
  });
});
