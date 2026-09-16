import { createLangProvider } from 'alambre';
import { storage } from '../storage';

const langs = {
  es: {
    common: {
      back: 'Volver',
    },
    home: {
      title: 'Base Template',
      subtitle: 'Punto de partida para tu próxima app.',
      openDetails: 'Abrir subpágina de ejemplo',
      openSettings: 'Ajustes',
      showToast: 'Mostrar toast',
    },
    details: {
      title: 'Subpágina',
      text: 'Las subpáginas se navegan con navigate(target, { subpage }).',
    },
    settings: {
      title: 'Ajustes',
      language: 'Idioma',
      theme: 'Tema',
    },
  },
  en: {
    common: {
      back: 'Back',
    },
    home: {
      title: 'Base Template',
      subtitle: 'A starting point for your next app.',
      openDetails: 'Open example subpage',
      openSettings: 'Settings',
      showToast: 'Show toast',
    },
    details: {
      title: 'Subpage',
      text: 'Subpages are reached with navigate(target, { subpage }).',
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
    },
  },
};

export const { LangProvider, useLang } = createLangProvider(
  langs,
  storage,
);
