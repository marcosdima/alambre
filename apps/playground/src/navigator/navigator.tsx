import Home from '../views/home/Home';
import AnimatedIconsTestbed from '../views/animated-icons/AnimatedIconsTestbed';
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
  animatedIcons: {
    title: { es: 'Animated Icons', en: 'Animated Icons' },
    component: <AnimatedIconsTestbed />,
  }
};

export default pages;
