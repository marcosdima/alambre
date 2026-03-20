export type ThemeName = 'light' | 'dark';

export type ThemeState = {
  themeName: ThemeName;
};

export type UseLightDarkType<T extends object> = {
  theme: T;
  toggleTheme: () => Promise<void>;
  setThemeName: (theme: ThemeName) => Promise<void>;
  currThemeName: ThemeName;
};
