import { useSyncExternalStore, useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import type {
  Page,
  NavigatorObject,
  NavigatorReturn,
  NavigatorProviderProps,
  NavigationSettings,
  NavigationGuard,
} from '../../types/navigator';
import createStore from '../../core/create-store';

type NavigatorStackEntry = {
  page: string;
  params?: Record<string, unknown>;
};

type NavigatorState = {
  pages: NavigatorObject;
  currentPage: string;
  currentParams?: Record<string, unknown>;
  stack: NavigatorStackEntry[];
  scrollTop: number;
};

const navigatorStore = createStore<NavigatorState | null>(null);

const navigationGuards = new Set<NavigationGuard>();
let isGuarding = false;

export const registerNavigationGuard = (guard: NavigationGuard): (() => void) => {
  navigationGuards.add(guard);
  return () => {
    navigationGuards.delete(guard);
  };
};

export const useNavigationGuard = (guard: NavigationGuard): void => {
  const guardRef = useRef(guard);
  guardRef.current = guard;
  useEffect(() => {
    const handler: NavigationGuard = () => guardRef.current();
    return registerNavigationGuard(handler);
  }, []);
};

export const executeNavigationGuards = (): boolean | Promise<boolean> => {
  const guards = Array.from(navigationGuards);
  for (let i = 0; i < guards.length; i++) {
    let result: boolean | Promise<boolean>;
    try {
      result = guards[i]();
    } catch {
      return false;
    }
    if (result instanceof Promise || (typeof result === 'object' && result !== null && 'then' in result)) {
      return (async () => {
        try {
          const allowed = await result;
          if (!allowed) return false;
        } catch {
          return false;
        }
        for (let j = i + 1; j < guards.length; j++) {
          try {
            const nextAllowed = await guards[j]();
            if (!nextAllowed) return false;
          } catch {
            return false;
          }
        }
        return true;
      })();
    }
    if (!result) {
      return false;
    }
  }
  return true;
};

export const initNavigator = (pages: NavigatorObject) => {
  navigationGuards.clear();
  isGuarding = false;
  const firstPage = Object.keys(pages).shift() ?? '';
  navigatorStore.setState({
    pages,
    currentPage: firstPage,
    stack: [],
    scrollTop: 0,
  });
};

export const navigatorActions = {
  navigate: (target: string, settings: NavigationSettings = {}) => {
    const state = navigatorStore.getState();
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

    navigatorStore.setState((prev) => prev ? {
      ...prev,
      stack: [...prev.stack, { page: prev.currentPage, params: prev.currentParams }],
      currentPage: aux,
      currentParams: params,
      scrollTop: 0,
    } : prev);
  },

  replace: (target: string, settings: NavigationSettings = {}) => {
    const state = navigatorStore.getState();
    if (!state) return;
    const { subpage, params } = settings;
    const aux = subpage ? `${target},${subpage}` : String(target);
    navigatorStore.setState((prev) => prev ? {
      ...prev,
      currentPage: aux,
      currentParams: params,
      scrollTop: 0,
    } : prev);
  },

  reset: (target: string, settings: NavigationSettings = {}) => {
    const state = navigatorStore.getState();
    if (!state) return;
    const { subpage, params } = settings;
    const aux = subpage ? `${target},${subpage}` : String(target);
    navigatorStore.setState((prev) => prev ? {
      ...prev,
      stack: [],
      currentPage: aux,
      currentParams: params,
      scrollTop: 0,
    } : prev);
  },

  popToTop: () => {
    const state = navigatorStore.getState();
    if (!state || state.stack.length === 0) return;

    const performPopToTop = () => {
      navigatorStore.setState((prev) => {
        if (!prev || prev.stack.length === 0) return prev;
        const root = prev.stack[0];
        return {
          ...prev,
          stack: [],
          currentPage: root.page,
          currentParams: root.params,
          scrollTop: 0,
        };
      });
    };

    if (navigationGuards.size === 0) {
      performPopToTop();
      return;
    }

    if (isGuarding) return;

    const outcome = executeNavigationGuards();
    if (typeof outcome === 'boolean') {
      if (outcome) {
        performPopToTop();
      }
      return;
    }

    isGuarding = true;
    void outcome.then((allowed) => {
      isGuarding = false;
      if (allowed) {
        performPopToTop();
      }
    }).catch(() => {
      isGuarding = false;
    });
  },

  previous: () => {
    const state = navigatorStore.getState();
    if (!state || state.stack.length === 0) return;

    const performPop = () => {
      navigatorStore.setState((prev) => {
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
    };

    if (navigationGuards.size === 0) {
      performPop();
      return;
    }

    if (isGuarding) return;

    const outcome = executeNavigationGuards();
    if (typeof outcome === 'boolean') {
      if (outcome) {
        performPop();
      }
      return;
    }

    isGuarding = true;
    void outcome.then((allowed) => {
      isGuarding = false;
      if (allowed) {
        performPop();
      }
    }).catch(() => {
      isGuarding = false;
    });
  },

  setScrollTop: (scrollTop: number) => {
    navigatorStore.setState((prev) => {
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
  const state = useSyncExternalStore(navigatorStore.subscribe, navigatorStore.getState);

  useEffect(() => {
    const onBackPress = () => {
      const current = navigatorStore.getState();
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

  const [routeKeyPart, subpagePart] = state.currentPage.split(',');

  return {
    currentPage: getComponent(state.currentPage.split(',')),
    pageKey: state.stack.map((s) => s.page).join(', '),
    routeKey: state.stack.length === 0
      ? state.currentPage
      : `${state.stack.map((s) => s.page).join(', ')} > ${state.currentPage}`,
    currentRoute: routeKeyPart ?? '',
    currentSubpage: subpagePart,
    currentParams: state.currentParams as TParams | undefined,
    noPreviousPages: state.stack.length === 0,
    canGoBack: state.stack.length > 0,
    scrollTop: state.scrollTop,
    navigate: navigatorActions.navigate as NavigatorReturn<TRoute, TSubpage, TParams>['navigate'],
    replace: navigatorActions.replace as NavigatorReturn<TRoute, TSubpage, TParams>['replace'],
    reset: navigatorActions.reset as NavigatorReturn<TRoute, TSubpage, TParams>['reset'],
    popToTop: navigatorActions.popToTop,
    previous: navigatorActions.previous,
    setScrollTop: navigatorActions.setScrollTop,
  };
};

export const NavigatorProvider = ({ children, pages }: NavigatorProviderProps) => {
  if (!navigatorStore.getState()) {
    initNavigator(pages);
  }
  useEffect(() => {
    navigatorStore.setState((prev) => prev ? { ...prev, pages } : prev);
  }, [pages]);
  return <>{children}</>;
};
