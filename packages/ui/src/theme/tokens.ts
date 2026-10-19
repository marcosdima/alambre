export interface ThemeTokens {
  fontFamily?: string;
  color: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  secondary: string;
  secondarySoft: string;
  sand: string;
  sandSoft: string;
  border: string;
  borderSoft: string;
  muted: string;
  success: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  overlayBar: string;
}

export const defaultLightTheme: ThemeTokens = {
  fontFamily: undefined,
  color: '#2d2f2d',
  background: '#ece6d6',
  surface: '#f3eedf',
  surfaceAlt: '#d2bca8',
  primary: '#475440',
  primarySoft: '#c3ceb3',
  onPrimary: '#ffffff',
  secondary: '#1d4ed8',
  secondarySoft: '#dbeafe',
  sand: '#a37042',
  sandSoft: '#e0cdbb',
  border: '#8f938f',
  borderSoft: '#d6cfbd',
  muted: '#737a73',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#c16757',
  dangerSoft: '#e2c5c0',
  overlay: 'rgba(45, 47, 45, 0.45)',
  overlayBar: 'rgba(45, 47, 45, 0.05)',
};

export const defaultDarkTheme: ThemeTokens = {
  fontFamily: undefined,
  color: '#ece6d6',
  background: '#1a1c1a',
  surface: '#252725',
  surfaceAlt: '#3a352f',
  primary: '#c3ceb3',
  primarySoft: '#333b30',
  onPrimary: '#1a1c1a',
  secondary: '#60a5fa',
  secondarySoft: '#1e355b',
  sand: '#d2bca8',
  sandSoft: '#3a352f',
  border: '#4d504d',
  borderSoft: '#313431',
  muted: '#a3a8a3',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#e2c5c0',
  dangerSoft: '#472d28',
  overlay: 'rgba(0, 0, 0, 0.65)',
  overlayBar: 'rgba(236, 230, 214, 0.15)',
};
