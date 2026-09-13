import type { Storage } from '../../types/actions';
import BaseModule from '../base-module';
import type { ThemeName, ThemeState } from './theme-types';

const lightDarkThemeKey = 'lightDarkThemeKey';

export default class ThemeModule<T extends object> extends BaseModule<ThemeState> {
  constructor(
    private readonly lightTheme: T,
    private readonly darkTheme: T,
    private readonly storage: Storage,
  ) {
    super({ themeName: 'light' });
  }


  async init() {
    const stored = await this.storage.get(lightDarkThemeKey);
    if (stored === 'dark' || stored === 'light') {
      this.setState({ themeName: stored });
    }
  }


  async setThemeName(themeName: ThemeName) {
    this.setState({ themeName });
    await this.storage.set(lightDarkThemeKey, themeName);
  }


  async toggleTheme() {
    const next = this.getState().themeName === 'light' ? 'dark' : 'light';
    await this.setThemeName(next);
  }


  getTheme(themeName: ThemeName) {
    return themeName === 'light'
      ? this.lightTheme
      : this.darkTheme;
  }
}
