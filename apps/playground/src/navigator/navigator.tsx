import Home from '../views/home/Home';
import CardGameTestbed from '../views/card-game/CardGameTestbed';
import CardArrivalSimulator from '../views/card-arrival/CardArrivalSimulator';
import TypographyTestbed from '../views/typography/TypographyTestbed';
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
  cardArrival: {
    title: { es: 'Card Arrival Simulation', en: 'Card Arrival Simulation' },
    component: <CardArrivalSimulator />,
  },
  cardGame: {
    title: { es: 'Card Game Arena', en: 'Card Game Arena' },
    component: <CardGameTestbed />,
  },
  typography: {
    title: { es: 'Typography System', en: 'Typography System' },
    component: <TypographyTestbed />,
  },
};

export default pages;
