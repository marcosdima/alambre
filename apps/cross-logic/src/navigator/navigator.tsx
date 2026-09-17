import type { ReactElement } from 'react';
import Home from '../views/home/Home';
import GameScreen from '../views/game/GameScreen';
import HowToPlay from '../views/howToPlay/HowToPlay';
import Settings from '../views/settings/Settings';

export interface PageTitle {
  es: string;
  en: string;
}

export interface AppNavigatorPage {
  component: ReactElement;
  title?: PageTitle;
}

export const pages: Record<string, AppNavigatorPage> = {
  home: {
    component: <Home />,
  },
  game: {
    component: <GameScreen />,
    title: { es: 'Partida', en: 'Game' },
  },
  howToPlay: {
    component: <HowToPlay />,
    title: { es: 'Cómo Jugar', en: 'How to Play' },
  },
  settings: {
    component: <Settings />,
    title: { es: 'Ajustes', en: 'Settings' },
  },
};

export default pages;
