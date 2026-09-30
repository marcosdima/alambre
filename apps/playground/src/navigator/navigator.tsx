import Home from '../views/home/Home';
import CarouselTest from '../views/carousel/CarouselTest';
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
  carousel: {
    title: { es: 'Carruseles', en: 'Carousels' },
    component: <CarouselTest />,
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
