import Home from '../views/home/Home';
import GameScreen from '../views/game/GameScreen';
import HowToPlay from '../views/howToPlay/HowToPlay';
import Settings from '../views/settings/Settings';

export default {
  home: {
    component: <Home />,
  },
  game: {
    component: <GameScreen />,
  },
  howToPlay: {
    component: <HowToPlay />,
  },
  settings: {
    component: <Settings />,
  },
};
