import type { FC, ReactNode, ReactElement } from 'react';
import type { Storage } from '../../types/actions';
import createStore from '../../core/create-store';
import { useExternalStore } from '../../core/use-external-store';
import type { Langs, LangState, UseLangType } from './lang-types';

const langKey = 'currentLanguage';

const LangProvider: FC<{ children?: ReactNode }> = ({ children }) => (children ?? null) as ReactElement | null;

const createLang = <T extends Langs>(
  langs: T,
  storage: Storage,
) => {
  const firstLangKey = Object.keys(langs).shift() as keyof T | undefined;

  if (!firstLangKey) {
    throw new Error('createLang requires at least one language');
  }

  const store = createStore<LangState<T>>({ currentLang: firstLangKey });

  const changeLang = async (lang: keyof T) => {
    const target = langs[lang] ? lang : firstLangKey;

    store.setState({ currentLang: target });
    await storage.set(langKey, String(target));
  };

  const hydrate = async () => {
    const stored = await storage.get(langKey);
    if (!stored) return;
    if (!(stored in langs)) return;

    store.setState({ currentLang: stored as keyof T });
  };

  void hydrate();

  const useLang = (): UseLangType<T> => {
    const state = useExternalStore(store, (s) => s);
    return {
      lang: langs[state.currentLang],
      currentLang: state.currentLang,
      changeLang,
    };
  };

  return {
    store,
    actions: { changeLang },
    useLang,
    LangProvider,
  };
};

export default createLang;
