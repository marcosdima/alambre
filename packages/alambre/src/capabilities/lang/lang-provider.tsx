import type { Storage } from '../../types/actions';
import createProvider from '../../core/create-provider';
import createStore from '../../core/create-store';
import type { Langs, LangState, UseLangType } from './lang-types';

const langKey = 'currentLanguage';

type LangActions<T extends Langs> = {
  changeLang: (lang: keyof T) => Promise<void>;
};

const createLangProvider = <T extends Langs>(
  langs: T,
  storage: Storage,
) => {
  const { Provider, useValue } = createProvider<LangState<T>, LangActions<T>, UseLangType<T>>({
    setup: () => {
      const firstLangKey = Object.keys(langs).shift() as keyof T | undefined;

      if (!firstLangKey) {
        throw new Error('createLangProvider requires at least one language');
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

      return { store, actions: { changeLang }, hydrate };
    },
    mapValue: (state, { changeLang }) => ({
      lang: langs[state.currentLang],
      currentLang: state.currentLang,
      changeLang,
    }),
    missingProviderError: 'useLang must be used within a LangProvider',
  });

  return {
    LangProvider: Provider,
    useLang: useValue,
  };
};

export default createLangProvider;
