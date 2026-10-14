import { useSyncExternalStore, useEffect } from 'react';
import { BackHandler } from 'react-native';
import type {
  Page,
  NavigatorObject,
  NavigatorReturn,
  NavigatorProviderProps,
  NavigationSettings,
} from '../../types/navigator';
import { createStore } from '../../core/store';

type NavigatorState = {
  pages: NavigatorObject;
  currentPage: string;
  currentParams?: Record<string, unknown>;
  stack: { page: string; params?: Record<string, unknown> }[];
  scrollTop: number;
};

const navigatorStore = createStore<NavigatorState | null>(null);

export const initNavigator = (pages: NavigatorObject) => {
  const firstPage = Object.keys(pages).shift() ?? '';
  navigatorStore.set({
    pages,
    currentPage: firstPage,
    stack: [],
    scrollTop: 0,
  });
};

export const navigatorActions = {
  navigate: (target: string, settings: NavigationSettings = {}) => {
    const state = navigatorStore.get();
    if (!state) return;
    const { subpage, params } = settings;
    const aux = subpage ? `${target},${subpage}` : String(target);
    let sameParams = false;
    try {
      sameParams = JSON.stringify(params) === JSON.stringify(state.currentParams);
    } catch {
      sameParams = params === state.currentParams;
    }
    if (aux === state.currentPage && sameParams) return;

    navigatorStore.set((prev) => prev ? {
      ...prev,
      stack: [...prev.stack, { page: prev.currentPage, params: prev.currentParams }],
      currentPage: aux,
      currentParams: params,
      scrollTop: 0,
    } : prev);
  },

  previous: () => {
    const state = navigatorStore.get();
    if (!state || state.stack.length === 0) return;

    navigatorStore.set((prev) => {
      if (!prev) return prev;
      const newStack = [...prev.stack];
      const target = newStack.pop();
      if (!target) return prev;
      return {
        ...prev,
        stack: newStack,
        currentPage: target.page,
        currentParams: target.params,
        scrollTop: 0,
      };
    });
  },

  setScrollTop: (scrollTop: number) => {
    navigatorStore.set((prev) => {
      if (!prev || prev.scrollTop === scrollTop) return prev;
      return { ...prev, scrollTop };
    });
  },
};

export const useNavigator = <
  TRoute extends string | Record<string, unknown> = string,
  TSubpage extends string = string,
  TParams = Record<string, unknown>,
>(): NavigatorReturn<TRoute, TSubpage, TParams> => {
  const state = useSyncExternalStore(navigatorStore.subscribe, navigatorStore.get);

  useEffect(() => {
    const onBackPress = () => {
      const current = navigatorStore.get();
      if (current && current.stack.length > 0) {
        navigatorActions.previous();
        return true;
      }
      return false;
    };
    const sub = BackHandler?.addEventListener?.('hardwareBackPress', onBackPress);
    return () => {
      sub?.remove?.();
    };
  }, []);

  if (!state) {
    throw new Error('Navigator not initialized. Call initNavigator() first.');
  }

  const getComponent = (path: readonly string[]) => {
    const { pages } = state;
    const firstPage = Object.keys(pages).shift() ?? '';
    const [firstKey, ...rest] = path;
    if (!firstKey) return pages[firstPage];
    const first = pages[firstKey];
    if (!first) return pages[firstPage] ?? { component: null };
    if (rest.length === 0) return first;
    return rest.reduce(
      (acc, key) => acc?.subpages?.[key],
      first as Page | undefined,
    ) ?? first;
  };

  return {
    currentPage: getComponent(state.currentPage.split(',')),
    pageKey: state.stack.map((s) => s.page).join(', '),
    currentParams: state.currentParams as TParams | undefined,
    noPreviousPages: state.stack.length === 0,
    scrollTop: state.scrollTop,
    navigate: navigatorActions.navigate as NavigatorReturn<TRoute, TSubpage, TParams>['navigate'],
    previous: navigatorActions.previous,
    setScrollTop: navigatorActions.setScrollTop,
  };
};

export const NavigatorProvider = ({ children, pages }: NavigatorProviderProps) => {
  if (!navigatorStore.get()) {
    initNavigator(pages);
  }
  useEffect(() => {
    navigatorStore.set((prev) => prev ? { ...prev, pages } : prev);
  }, [pages]);
  return <>{children}</>;
};
