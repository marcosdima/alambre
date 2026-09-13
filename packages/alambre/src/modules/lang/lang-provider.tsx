import type { Storage } from '../../types/actions';
import createModuleProvider from '../module-provider';
import LangModule from './lang-module';
import type { LangState, Langs, UseLangType } from './lang-types';

const createLangProvider = <T extends Langs>(
  langs: T,
  storage: Storage,
) => {
  const {
    Provider,
    useValue,
  } = createModuleProvider<LangState<T>, LangModule<T>, UseLangType<T>>({
    createModule: () => new LangModule(langs, storage),
    mapContextValue: (module, state) => ({
      lang: langs[state.currentLang],
      currentLang: state.currentLang,
      changeLang: module.changeLang.bind(module),
    }),
    missingProviderError: 'useLang must be used within a LangProvider',
  });

  return {
    LangProvider: Provider,
    useLang: useValue,
  };
};

export default createLangProvider;
