import Home from '../views/home/Home';
import Details from '../views/home/Details';
import Settings from '../views/settings/Settings';
import AnimationTest from '../views/animation-test/AnimationTest';
import ToastTest from '../views/toast-test/ToastTest';
import ComponentsTest from '../views/components-test/ComponentsTest';
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
  animations: {
    title: { es: 'Test de Animaciones', en: 'Animation Test' },
    component: <AnimationTest />,
  },
  toast: {
    title: { es: 'Test de Toast', en: 'Toast Test' },
    component: <ToastTest />,
  },
  components: {
    title: { es: 'UI Components', en: 'UI Components' },
    component: <ComponentsTest />,
  },
};

export default pages;
