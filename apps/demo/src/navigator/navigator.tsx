
import Home from '../views/navigator/Home';
import Configuration from '../views/navigator/Configuration';
import Play from '../views/navigator/Play';
import Advance from '../views/navigator/Advance';
import Toast from '../views/navigator/Toast';

export default {
  home: {
    component: <Home />,
    subpages: {
      configuration: {
        component: <Configuration/>,
        subpages: {
          advance: {
            component: <Advance />,
          },
        },
      },
    },
  },
  play: {
    component: <Play />,
  },
  toast: {
    component: <Toast />,
  },
};
