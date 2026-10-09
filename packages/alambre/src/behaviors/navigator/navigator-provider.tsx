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
  stack: string[];
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
    const { subpage } = settings;
    const aux = subpage ? `${target},${subpage}` : String(target);
    if (aux === state.currentPage) return;

    navigatorStore.set((prev) => prev ? {
      ...prev,
      stack: [...prev.stack, prev.currentPage],
      currentPage: aux,
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
        currentPage: target,
        scrollTop: 0,
      };
    });
  },

  setScrollTop: (scrollTop: number) => {
    navigatorStore.set((prev) => prev ? { ...prev, scrollTop } : prev);
  },
};

export const useNavigator = <
  TRoute extends string | Record<string, unknown> = string,
  TSubpage extends string = string,
>(): NavigatorReturn<TRoute, TSubpage> => {
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
    pageKey: state.stack.join(', '),
    noPreviousPages: state.stack.length === 0,
    scrollTop: state.scrollTop,
    navigate: navigatorActions.navigate as NavigatorReturn<TRoute, TSubpage>['navigate'],
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
