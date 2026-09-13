import Home from '../views/home/Home';
import Details from '../views/home/Details';
import Settings from '../views/settings/Settings';

export default {
  home: {
    component: <Home />,
    subpages: {
      details: {
        component: <Details />,
      },
    },
  },
  settings: {
    component: <Settings />,
  },
};
