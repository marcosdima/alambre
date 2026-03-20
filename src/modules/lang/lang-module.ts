import type { ActionTypes } from '../../types';
import BaseModule from '../base-module';
import type { Langs, LangState } from './lang-types';

const langKey = 'currentLanguage';

export default class LangModule<T extends Langs> extends BaseModule<LangState<T>> {
  private readonly firstLangKey: keyof T;


  constructor(
    private readonly langs: T,
    private readonly storage: ActionTypes.Storage,
  ) {
    const firstLangKey = Object.keys(langs).shift() as keyof T | undefined;

    if (!firstLangKey) {
      throw new Error('createLangProvider requires at least one language');
    }

    super({ currentLang: firstLangKey });
    this.firstLangKey = firstLangKey;
  }


  async init() {
    const stored = await this.storage.get(langKey);
    if (!stored) return;
    if (!(stored in this.langs)) return;

    this.setState({ currentLang: stored as keyof T });
  }


  async changeLang(lang: keyof T) {
    const target = this.langs[lang] ? lang : this.firstLangKey;

    this.setState({ currentLang: target });
    await this.storage.set(langKey, String(target));
  }
}
