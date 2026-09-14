import Home from '../views/home/Home';
import Items from '../views/items/Items';
import ItemForm from '../views/items/ItemForm';
import Alarms from '../views/alarms/Alarms';
import AlarmForm from '../views/alarms/AlarmForm';
import Settings from '../views/settings/Settings';
import { langs } from '../providers/lang';
import type { NavigatorTypes } from 'alambre';

export type PageTitle = { es: string; en: string };

export type AppPage = NavigatorTypes.Page & {
  title?: PageTitle;
  titles?: { add: PageTitle; edit: PageTitle };
  subpages?: Record<string, AppPage>;
};

const title = (es: string, en: string): PageTitle => ({ es, en });

export const pages: Record<string, AppPage> = {
  home: {
    component: <Home />,
  },
  items: {
    component: <Items />,
    title: title(langs.es.items.title, langs.en.items.title),
    subpages: {
      'item-form': {
        component: <ItemForm />,
        titles: {
          add: title(langs.es.items.addTitle, langs.en.items.addTitle),
          edit: title(langs.es.items.editTitle, langs.en.items.editTitle),
        },
      },
    },
  },
  alarms: {
    component: <Alarms />,
    title: title(langs.es.alarms.title, langs.en.alarms.title),
    subpages: {
      'alarm-form': {
        component: <AlarmForm />,
        titles: {
          add: title(langs.es.alarms.addTitle, langs.en.alarms.addTitle),
          edit: title(langs.es.alarms.editTitle, langs.en.alarms.editTitle),
        },
      },
    },
  },
  settings: {
    component: <Settings />,
    title: title(langs.es.settings.title, langs.en.settings.title),
  },
};

export default pages;
