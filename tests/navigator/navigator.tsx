
import Home from 'tests/views/navigator/Home';
import Configuration from 'tests/views/navigator/Configuration';
import Play from 'tests/views/navigator/Play';
import Advance from 'tests/views/navigator/Advance';
import Toast from 'tests/views/navigator/Toast';

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
