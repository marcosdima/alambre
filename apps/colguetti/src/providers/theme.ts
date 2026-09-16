import { createLightDarkProvider } from 'alambre';
import { storage } from '../storage';

export const light = {
  color: '#1f2937',
  background: '#f4f7fb',
  surface: '#ffffff',
  surfaceAlt: '#e6edf7',
  primary: '#0057d8',
  primarySoft: '#d9e7ff',
  onPrimary: '#ffffff',
  border: '#c9d6ea',
  muted: '#5e6a7f',
  success: '#0f7b6c',
  warning: '#8a5a00',
  danger: '#b42318',
  overlay: 'rgba(15, 23, 42, 0.45)',
  overlayBar: 'rgba(15, 23, 42, 0.06)',
};

export const dark = {
  color: '#e6edf8',
  background: '#0b101c',
  surface: '#141e30',
  surfaceAlt: '#1c2a42',
  primary: '#6ea8ff',
  primarySoft: '#1e3a66',
  onPrimary: '#081224',
  border: '#2b3d5c',
  muted: '#9eb0c8',
  success: '#3dc8b4',
  warning: '#ffc266',
  danger: '#ff7b7b',
  overlay: 'rgba(2, 6, 14, 0.6)',
  overlayBar: 'rgba(148, 180, 255, 0.22)',
};

export const { LightDarkProvider, useLightDark } = createLightDarkProvider(light, dark, storage);
