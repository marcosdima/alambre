import Home from '../views/home/Home';
import KineticOrchestratorTestbed from '../views/kinetics/KineticOrchestratorTestbed';
import KineticContainerTestbed from '../views/kinetics/KineticContainerTestbed';
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
  kinetics: {
    title: { es: 'Kinetic Orchestrator', en: 'Kinetic Orchestrator' },
    component: <KineticOrchestratorTestbed />,
  },
  kineticContainers: {
    title: { es: 'Kinetic Containers', en: 'Kinetic Containers' },
    component: <KineticContainerTestbed />,
  },
  cardGame: {
    title: { es: 'Card Game Engine (Active)', en: 'Card Game Engine (Active)' },
    component: <CardGameTestbed />,
  },

};

export default pages;
