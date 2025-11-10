
import Home from './Home';
import Configuration from './Configuration';
import Play from './Play';

export default {
  home: {
    component: <Home />,
    subpages: {
      configuration: {
        component: <Configuration/>,
      },
    },
  },
  play: {
    component: <Play />,
  },
};
