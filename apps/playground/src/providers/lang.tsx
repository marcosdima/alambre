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
      openAnimations: 'Test de animaciones',
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
    animations: {
      title: 'Test de animaciones',
      subtitle: 'Playground interactivo para ajustar tiempos y distancias.',
      duration: 'Duración',
      delay: 'Delay / Stagger',
      distance: 'Distancia',
      pattern: 'Patrón',
      patternAlternate: 'Alternado (Izq / Der)',
      patternCascade: 'Cascada vertical',
      replay: 'Repetir animación',
      card1: 'Sección 1',
      card2: 'Sección 2',
      card3: 'Sección 3',
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
      openAnimations: 'Animation Playground',
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
    animations: {
      title: 'Animation Playground',
      subtitle: 'Interactive playground to test timing and distances.',
      duration: 'Duration',
      delay: 'Delay / Stagger',
      distance: 'Distance',
      pattern: 'Pattern',
      patternAlternate: 'Alternating (Left / Right)',
      patternCascade: 'Vertical cascade',
      replay: 'Replay animation',
      card1: 'Section 1',
      card2: 'Section 2',
      card3: 'Section 3',
    },
  },
};

export const { LangProvider, useLang } = createLangProvider(
  langs,
  storage,
);
