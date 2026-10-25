import type { DefaultReact } from '../types';
import type { ReactNode } from 'react';

export type AnimationDefault = 'to-left' | 'to-right';

export type Page = {
  component: ReactNode;
  transition?: AnimationDefault;
  subpages?: NavigatorObject;
}

export type NavigatorObject = Record<string, Page>;

export type NavigationSettings<TSubpage extends string = string, TParams = Record<string, unknown>> = {
  subpage?: TSubpage;
  params?: TParams;
};

export type NavigatorRouteKey<TRoute> = TRoute extends string
  ? TRoute
  : keyof TRoute & string;

export type NavigationGuard = () => boolean | Promise<boolean>;

export type NavigatorReturn<
  TRoute extends string | Record<string, unknown> = string,
  TSubpage extends string = string,
  TParams = Record<string, unknown>,
> = {
  currentPage: Page;
  pageKey: string;
  routeKey: string;
  currentRoute: string;
  currentSubpage?: string;
  currentParams?: TParams;
  noPreviousPages: boolean;
  canGoBack: boolean;
  scrollTop: number;
  navigate: (
    target: NavigatorRouteKey<TRoute>,
    settings?: NavigationSettings<TSubpage, TParams>,
  ) => void;
  replace: (
    target: NavigatorRouteKey<TRoute>,
    settings?: NavigationSettings<TSubpage, TParams>,
  ) => void;
  reset: (
    target: NavigatorRouteKey<TRoute>,
    settings?: NavigationSettings<TSubpage, TParams>,
  ) => void;
  popToTop: () => void;
  previous: () => void;
  setScrollTop: (value: number) => void;
};

export type NavigatorProviderProps = DefaultReact.ViewProps & {
  pages: NavigatorObject;
};
