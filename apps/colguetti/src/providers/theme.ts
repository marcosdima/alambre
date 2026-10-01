import { createLightDarkProvider } from 'alambre';
import { storage } from '../storage';

export const light = {
  color: '#1c2128',
  background: '#fbf9f4',
  surface: '#ffffff',
  surfaceAlt: '#f1ede2',
  primary: '#15803d',
  primarySoft: '#dcfce7',
  onPrimary: '#ffffff',
  secondary: '#1d4ed8',
  secondarySoft: '#dbeafe',
  sand: '#b45309',
  sandSoft: '#fef3c7',
  border: '#374151',
  borderSoft: '#e2ddd0',
  muted: '#64748b',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  overlay: 'rgba(15, 23, 42, 0.45)',
  overlayBar: 'rgba(15, 23, 42, 0.05)',
};

export const dark = {
  color: '#f1f5f9',
  background: '#0c1322',
  surface: '#141d30',
  surfaceAlt: '#1c2842',
  primary: '#4ade80',
  primarySoft: '#143825',
  onPrimary: '#0c1322',
  secondary: '#60a5fa',
  secondarySoft: '#1e355b',
  sand: '#fbbf24',
  sandSoft: '#3d2f0f',
  border: '#2e405f',
  borderSoft: '#1e2d45',
  muted: '#94a3b8',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  dangerSoft: '#381619',
  overlay: 'rgba(2, 6, 14, 0.65)',
  overlayBar: 'rgba(96, 165, 250, 0.15)',
};

export const { LightDarkProvider, useLightDark } = createLightDarkProvider(light, dark, storage);

