import Home from '../views/home/Home';
import Details from '../views/home/Details';
import Settings from '../views/settings/Settings';
import type { NavigatorTypes } from 'alambre';

export type PageTitle = Record<'es' | 'en', string>;

export type AppPage = NavigatorTypes.Page & {
  title?: PageTitle;
  subpages?: Record<string, AppPage>;
};

export const pages: Record<string, AppPage> = {
  home: {
    component: <Home />,
    subpages: {
      details: {
        title: { es: 'Subpágina', en: 'Subpage' },
        component: <Details />,
      },
    },
  },
  settings: {
    title: { es: 'Ajustes', en: 'Settings' },
    component: <Settings />,
  },
};

export default pages;
