import type { DefaultReact } from '../types';
import type { ReactNode } from 'react';

export type AnimationDefault = 'to-left' | 'to-right';

export type Page = {
  component: ReactNode;
  transition?: AnimationDefault;
  subpages?: NavigatorObject;
}

export type NavigatorObject = Record<string, Page>;

export type NavigatorReturn = {
  currentPage: Page;
  pageKey: string;
  noPreviousPages: boolean;
  navigate: (target: string, settings?: NavigationSettings) => void;
  previous: () => void;
};

export type NavigatorProviderProps = DefaultReact.ViewProps & {
  pages: NavigatorObject;
};

export type NavigationSettings = {
  subpage?: string,
};
