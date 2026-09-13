import { createLightDarkProvider } from 'alambre';
import { toAlambreStorage } from '../storage/alambre-storage';
import { asyncStorageRaw } from '../storage/async';

export const light = {
  color: '#1f2937',
  background: '#f4f7fb',
  surface: '#ffffff',
  surfaceAlt: '#e8eef7',
  primary: '#0057d8',
  primarySoft: '#d9e7ff',
  onPrimary: '#ffffff',
  border: '#c9d6ea',
  muted: '#5e6a7f',
};

export const dark = {
  color: '#e6edf8',
  background: '#0e1624',
  surface: '#162235',
  surfaceAlt: '#1d2d45',
  primary: '#6ea8ff',
  primarySoft: '#233a5f',
  onPrimary: '#081224',
  border: '#32455f',
  muted: '#9eb0c8',
};

export const { LightDarkProvider, useLightDark } = createLightDarkProvider(
  light,
  dark,
  toAlambreStorage(asyncStorageRaw),
);
