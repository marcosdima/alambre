import Home from '../views/home/Home';
import RoomRelayWebTestbed from '../views/relay/RoomRelayWebTestbed';
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
  roomRelayWeb: {
    title: { es: 'Relay Web & Mensajería', en: 'Web Room Relay' },
    component: <RoomRelayWebTestbed />,
  },
};

export default pages;
