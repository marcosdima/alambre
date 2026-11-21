import React from 'react';
import type { Page } from 'alambre';
import Home from '../views/home/Home';
import CardMotionSimulation from '../views/simulations/CardMotionSimulation';
import ElasticPhysicsSimulation from '../views/simulations/ElasticPhysicsSimulation';
import FluidDndSimulation from '../views/simulations/FluidDndSimulation';
import DeckSwipeSimulation from '../views/simulations/DeckSwipeSimulation';
import SpatialMorphSimulation from '../views/simulations/SpatialMorphSimulation';

export type PageTitle = Record<'es' | 'en', string>;

export type AppPage = Page & {
  title?: PageTitle;
  subpages?: Record<string, AppPage>;
};

export const pages: Record<string, AppPage> = {
  home: {
    component: <Home />,
  },
  cardMotion: {
    title: { es: 'Card Kinetics & Spatial Flight', en: 'Card Kinetics & Spatial Flight' },
    component: <CardMotionSimulation />,
  },
  elasticPhysics: {
    title: { es: 'Elastic Physics & Collisions', en: 'Elastic Physics & Collisions' },
    component: <ElasticPhysicsSimulation />,
  },
  fluidDnd: {
    title: { es: 'Fluid Drag & Drop Transfers', en: 'Fluid Drag & Drop Transfers' },
    component: <FluidDndSimulation />,
  },
  deckSwipe: {
    title: { es: '3D Kinetic Deck Swiping', en: '3D Kinetic Deck Swiping' },
    component: <DeckSwipeSimulation />,
  },
  spatialMorph: {
    title: { es: 'Spatial Hero Morph & Wavefront', en: 'Spatial Hero Morph & Wavefront' },
    component: <SpatialMorphSimulation />,
  },
};

export default pages;
