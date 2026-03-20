
import Home from './Home';
import Configuration from './Configuration';
import Play from './Play';
import Advance from './Advance';
import Toast from './Toast';

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
