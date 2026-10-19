import Home from '../views/home/Home';
import CardGameTestbed from '../views/card-game/CardGameTestbed';
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
  cardGame: {
    title: { es: 'Card Game Arena', en: 'Card Game Arena' },
    component: <CardGameTestbed />,
  },
};

export default pages;
