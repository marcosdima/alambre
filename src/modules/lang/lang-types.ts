export type Langs = Record<string, object>;

export type LangState<T extends Langs> = {
  currentLang: keyof T;
};

export type UseLangType<T extends Langs> = {
  lang: T[keyof T];
  currentLang: keyof T;
  changeLang: (newLangKey: keyof T) => Promise<void>;
};
