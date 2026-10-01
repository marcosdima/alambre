import type { DefaultReact } from '../types';
import type { ReactNode } from 'react';

export type AnimationDefault = 'to-left' | 'to-right';

export type Page = {
  component: ReactNode;
  transition?: AnimationDefault;
  subpages?: NavigatorObject;
}

export type NavigatorObject = Record<string, Page>;

export type NavigationSettings<TSubpage extends string = string> = {
  subpage?: TSubpage;
};

export type NavigatorRouteKey<TRoute> = TRoute extends string
  ? TRoute
  : keyof TRoute & string;

export type NavigatorReturn<
  TRoute extends string | Record<string, unknown> = string,
  TSubpage extends string = string,
> = {
  currentPage: Page;
  pageKey: string;
  noPreviousPages: boolean;
  scrollTop: number;
  navigate: (
    target: NavigatorRouteKey<TRoute>,
    settings?: NavigationSettings<TSubpage>,
  ) => void;
  previous: () => void;
  setScrollTop: (value: number) => void;
};

export type NavigatorProviderProps = DefaultReact.ViewProps & {
  pages: NavigatorObject;
};
