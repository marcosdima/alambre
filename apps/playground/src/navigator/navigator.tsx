import Home from '../views/home/Home';
import ContainersHub from '../views/containers/ContainersHub';
import ComponentsTest from '../views/components-test/ComponentsTest';
import TextAnimationsTest from '../views/text-animations/TextAnimationsTest';
import DndTest from '../views/dnd-test/DndTest';
import type { NavigatorTypes } from 'alambre';

export type PageTitle = Record<'es' | 'en', string>;

export type AppPage = NavigatorTypes.Page & {
  title?: PageTitle;
  subpages?: Record<string, AppPage>;
};

export const pages: Record<string, AppPage> = {
  home: {
    component: <Home />,
  },
  containers: {
    title: { es: 'Contenedores Interactivos', en: 'Interactive Containers' },
    component: <ContainersHub />,
  },
  carousel: {
    title: { es: 'Contenedores Interactivos', en: 'Interactive Containers' },
    component: <ContainersHub />,
  },
  components: {
    title: { es: 'UI Components', en: 'UI Components' },
    component: <ComponentsTest />,
  },
  textAnimations: {
    title: { es: 'Animaciones de Texto', en: 'Text Animations' },
    component: <TextAnimationsTest />,
  },
  dnd: {
    title: { es: 'Drag & Drop', en: 'Drag & Drop' },
    component: <DndTest />,
  },
};

export default pages;
