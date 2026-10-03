import Home from '../views/home/Home';
import KineticListTestbed from '../views/kinetic-list/KineticListTestbed';
import SpatialTransitionsTestbed from '../views/spatial-transitions/SpatialTransitionsTestbed';
import type { Page } from 'alambre';

export type PageTitle = Record<'es' | 'en', string>;

export type AppPage = Page & {
  title?: PageTitle;
  subpages?: Record<string, AppPage>;
};

export const pages: Record<string, AppPage> = {
  home: {
    component: <Home />,
  },
  kineticList: {
    title: { es: 'Kinetic List Testbed', en: 'Kinetic List Testbed' },
    component: <KineticListTestbed />,
  },
  spatialTransitions: {
    title: { es: 'Spatial Transitions', en: 'Spatial Transitions' },
    component: <SpatialTransitionsTestbed />,
  },
};

export default pages;
