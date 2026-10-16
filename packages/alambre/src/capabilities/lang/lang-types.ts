export type LangDictionary = Record<string, any>;

export type Langs<L extends LangDictionary = Record<string, any>> = Record<string, L>;

export type LangState<T extends Record<string, any>> = {
  currentLang: keyof T;
};

export type UseLangType<
  T extends Record<string, any>,
  K extends keyof T = keyof T,
> = {
  lang: T[K];
  currentLang: K;
  changeLang: (newLangKey: keyof T) => Promise<void>;
};
