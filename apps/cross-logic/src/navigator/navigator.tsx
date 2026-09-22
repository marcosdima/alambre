import type { ReactElement } from 'react';
import Home from '../views/home/Home';
import GameSelect from '../views/gameSelect/GameSelect';
import GameScreen from '../views/game/GameScreen';
import History from '../views/history/History';
import PuzzleCreator from '../views/creator/PuzzleCreator';
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
  gameSelect: {
    component: <GameSelect />,
    title: { es: 'Nueva Partida', en: 'New Game' },
  },
  game: {
    component: <GameScreen />,
    title: { es: 'Partida', en: 'Game' },
  },
  history: {
    component: <History />,
    title: { es: 'Historial', en: 'History' },
  },
  creator: {
    component: <PuzzleCreator />,
    title: { es: 'Creador de Puzzles', en: 'Puzzle Creator' },
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
