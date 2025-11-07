import { createContext, useContext, useState, useEffect } from 'react';
import { DefaultReact, ActionTypes } from '@types';

const langKey = 'currentLanguage';
type Langs = Record<string, object>;

const useLangContext = <T extends Langs>(
  {
    langs,
    storage,
  }: {
    langs: T,
    storage: ActionTypes.Storage;
  }
) => {
  const [currentLang, setCurrentLang] = useState<keyof T>(
    Object.keys(langs).shift() as keyof T
  );

  useEffect(() => {
    (async () => {
      const stored = await storage.get(langKey);
      if (stored) setCurrentLang(stored);
    })();
  }, []);

  const changeLang = async (lang: keyof T) => {
    setCurrentLang(lang);
    await storage.set(langKey, lang);
  };

  return {
    lang: langs[currentLang],
    currentLang,
    changeLang,
  };
};

export const createLangProvider = <T extends Langs>(
  langs: T,
  storage: ActionTypes.Storage,
) => {
  const LangContext = createContext<
    | {
        lang: T[keyof T];
        currentLang: keyof T;
        changeLang: (newLangKey: keyof T) => void;
      }
    | undefined
  >(undefined);

  const LangProvider = ({ children, ...props}: DefaultReact.ViewProps) => {
    const value = useLangContext<T>({ langs, storage });
    return (
      <LangContext.Provider {...props} value={value}>
        {children}
      </LangContext.Provider>
    );
  };

  const useLang = () => {
    const ctx = useContext(LangContext);
    if (!ctx)
      throw new Error('useLightDark must be used within a LightDarkProvider');
    return ctx;
  };

  return { LangProvider, useLang };
};
