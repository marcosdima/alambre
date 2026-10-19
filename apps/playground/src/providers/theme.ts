import { createLightDarkProvider } from 'alambre';
import type { ThemeTokens } from '@some-alambre/ui';
import { storage } from '../storage';

export const light: ThemeTokens = {
  color: '#1f2937',
  background: '#f4f7fb',
  surface: '#ffffff',
  surfaceAlt: '#e8eef7',
  primary: '#0057d8',
  primarySoft: '#d9e7ff',
  onPrimary: '#ffffff',
  secondary: '#1d4ed8',
  secondarySoft: '#dbeafe',
  sand: '#a37042',
  sandSoft: '#fef3c7',
  border: '#c9d6ea',
  borderSoft: '#e2e8f0',
  muted: '#5e6a7f',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dangerSoft: '#fee2e2',
  overlay: 'rgba(15, 23, 42, 0.45)',
  overlayBar: 'rgba(15, 23, 42, 0.06)',
};

export const dark: ThemeTokens = {
  color: '#e6edf8',
  background: '#0e1624',
  surface: '#162235',
  surfaceAlt: '#1d2d45',
  primary: '#6ea8ff',
  primarySoft: '#233a5f',
  onPrimary: '#081224',
  secondary: '#60a5fa',
  secondarySoft: '#1e355b',
  sand: '#d2bca8',
  sandSoft: '#3a352f',
  border: '#32455f',
  borderSoft: '#243449',
  muted: '#9eb0c8',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  dangerSoft: '#451a1a',
  overlay: 'rgba(0, 0, 0, 0.65)',
  overlayBar: 'rgba(230, 237, 248, 0.12)',
};

export const { LightDarkProvider, useLightDark } = createLightDarkProvider(
  light,
  dark,
  storage,
);

