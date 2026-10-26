import Home from '../views/home/Home';
import RoomRelayWebTestbed from '../views/relay/RoomRelayWebTestbed';
import TurnEngineFoWTestbed from '../views/relay/TurnEngineFoWTestbed';
import KineticTabsSkeletonTestbed from '../views/kinetics/KineticTabsSkeletonTestbed';
import SortableDnDTestbed from '../views/kinetics/SortableDnDTestbed';
import SensoryKineticsTestbed from '../views/kinetics/SensoryKineticsTestbed';
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
  kineticTabs: {
    title: { es: 'Tabs Cinéticos & Esqueletos', en: 'Kinetic Tabs & Skeletons' },
    component: <KineticTabsSkeletonTestbed />,
  },
  sortableDnd: {
    title: { es: 'DnD Sortable (Lista & Grilla)', en: 'Sortable Drag & Drop' },
    component: <SortableDnDTestbed />,
  },
  turnEngineFoW: {
    title: { es: 'Fog-of-War & Migración Multiplayer', en: 'Multiplayer FoW & Migration' },
    component: <TurnEngineFoWTestbed />,
  },
  sensoryKinetics: {
    title: { es: 'Sensory Kinetics & Haptics', en: 'Sensory Kinetics & Haptics' },
    component: <SensoryKineticsTestbed />,
  },
};

export default pages;
