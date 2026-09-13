import Home from '../views/home/Home';
import Items from '../views/items/Items';
import ItemForm from '../views/items/ItemForm';
import Alarms from '../views/alarms/Alarms';
import AlarmForm from '../views/alarms/AlarmForm';
import Settings from '../views/settings/Settings';

export default {
  home: {
    component: <Home />,
  },
  items: {
    component: <Items />,
    subpages: {
      'item-form': {
        component: <ItemForm />,
      },
    },
  },
  alarms: {
    component: <Alarms />,
    subpages: {
      'alarm-form': {
        component: <AlarmForm />,
      },
    },
  },
  settings: {
    component: <Settings />,
  },
};
