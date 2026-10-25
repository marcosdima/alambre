import { renderHook, act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackHandler, type NativeEventSubscription } from 'react-native';
import {
  initNavigator,
  useNavigator,
  NavigatorProvider,
  useNavigationGuard,
  registerNavigationGuard,
  navigatorActions,
} from '../../src/behaviors/navigator';
import type { NavigatorObject, NavigatorReturn } from '../../src';

const homeComponent = null;
const formComponent = null;
const alarmsComponent = null;
const itemsComponent = null;

const pages: NavigatorObject = {
  home: {
    component: homeComponent,
    subpages: {
      form: { component: formComponent },
    },
  },
  alarms: { component: alarmsComponent },
  items: { component: itemsComponent },
};

describe('Headless Navigator behavior & store mechanics', () => {
  beforeEach(() => {
    initNavigator(pages);
  });

  it('initializes to the first page with empty stack and scrollTop 0 without any Provider', () => {
    const { result } = renderHook(() => useNavigator());

    expect(result.current.noPreviousPages).toBe(true);
    expect(result.current.pageKey).toBe('');
    expect(result.current.scrollTop).toBe(0);
    expect(result.current.currentPage).toEqual(pages.home);
  });

  it('navigate pushes current page to stack and switches page', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
    });

    expect(result.current.noPreviousPages).toBe(false);
    expect(result.current.pageKey).toBe('home');
    expect(result.current.currentPage).toEqual(pages.alarms);
  });

  it('previous pops from stack and restores previous page', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
      result.current.navigate('items');
    });

    expect(result.current.pageKey).toBe('home, alarms');
    expect(result.current.currentPage).toEqual(pages.items);

    act(() => {
      result.current.previous();
    });

    expect(result.current.pageKey).toBe('home');
    expect(result.current.currentPage).toEqual(pages.alarms);

    act(() => {
      result.current.previous();
    });

    expect(result.current.noPreviousPages).toBe(true);
    expect(result.current.pageKey).toBe('');
    expect(result.current.currentPage).toEqual(pages.home);

    // Calling previous when on root page is a safe no-op
    act(() => {
      result.current.previous();
    });
    expect(result.current.noPreviousPages).toBe(true);
  });

  it('navigate sets params and previous restores them', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms', { params: { id: 1 } });
    });

    expect(result.current.currentParams).toEqual({ id: 1 });

    act(() => {
      result.current.navigate('items', { params: { filter: 'active' } });
    });

    expect(result.current.currentParams).toEqual({ filter: 'active' });

    act(() => {
      result.current.previous();
    });

    expect(result.current.currentParams).toEqual({ id: 1 });

    act(() => {
      result.current.previous();
    });

    expect(result.current.currentParams).toBeUndefined();
  });

  it('navigating to the same current page with identical params is a no-op', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms', { params: { id: 1 } });
    });
    expect(result.current.pageKey).toBe('home');

    act(() => {
      result.current.navigate('alarms', { params: { id: 1 } });
    });
    expect(result.current.pageKey).toBe('home'); // stack didn't grow
  });

  it('navigating to the same current page is a no-op and does not pollute the stack', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('home');
    });

    expect(result.current.noPreviousPages).toBe(true);
    expect(result.current.pageKey).toBe('');

    act(() => {
      result.current.navigate('alarms');
      result.current.navigate('alarms');
    });

    expect(result.current.pageKey).toBe('home');
  });

  it('navigating to a subpage resolves the nested component and resets scrollTop', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.setScrollTop(250);
    });
    expect(result.current.scrollTop).toBe(250);

    act(() => {
      result.current.navigate('home', { subpage: 'form' });
    });

    expect(result.current.currentPage).toEqual(pages.home.subpages?.form);
    expect(result.current.noPreviousPages).toBe(false);
    expect(result.current.scrollTop).toBe(0);

    act(() => {
      result.current.previous();
    });

    expect(result.current.currentPage).toEqual(pages.home);
    expect(result.current.noPreviousPages).toBe(true);
  });

  it('setScrollTop updates scrollTop position', () => {
    const { result } = renderHook(() => useNavigator());

    expect(result.current.scrollTop).toBe(0);

    act(() => {
      result.current.setScrollTop(120);
    });

    expect(result.current.scrollTop).toBe(120);
  });

  it('registers hardwareBackPress on mount and cleans up on unmount', () => {
    let backHandler: (() => boolean) | undefined;
    const removeSpy = vi.fn();
    const addListenerSpy = vi.spyOn(BackHandler, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'hardwareBackPress') {
        backHandler = handler as () => boolean;
      }
      return { remove: removeSpy } as unknown as NativeEventSubscription;
    });

    const { result, unmount } = renderHook(() => useNavigator());

    expect(addListenerSpy).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));

    // When on root, hardwareBackPress returns false (allows app exit)
    expect(backHandler?.()).toBe(false);

    // After navigating forward, hardwareBackPress intercepts, pops history, and returns true
    act(() => {
      result.current.navigate('alarms');
    });
    expect(result.current.noPreviousPages).toBe(false);

    act(() => {
      const handled = backHandler?.();
      expect(handled).toBe(true);
    });

    expect(result.current.noPreviousPages).toBe(true);
    expect(result.current.currentPage).toEqual(pages.home);

    unmount();
    expect(removeSpy).toHaveBeenCalledTimes(1);
    addListenerSpy.mockRestore();
  });

  it('supports legacy NavigatorProvider for backwards compatibility', () => {
    let api: NavigatorReturn | undefined;

    const Consumer = () => {
      api = useNavigator();
      return null;
    };

    render(
      <NavigatorProvider pages={pages}>
        <Consumer />
      </NavigatorProvider>,
    );

    expect(api?.noPreviousPages).toBe(true);
    expect(api?.currentPage).toEqual(pages.home);
  });

  it('enforces compile-time route type safety when parameterized with route union', () => {
    type TestRoutes = 'home' | 'alarms' | 'items';
    const { result } = renderHook(() => useNavigator<TestRoutes>());

    act(() => {
      result.current.navigate('alarms');
    });

    expect(result.current.currentPage).toEqual(pages.alarms);
  });

  it('supports record object generic type for route keys and subpages', () => {
    const { result } = renderHook(() => useNavigator<typeof pages, 'form'>());

    act(() => {
      result.current.navigate('home', { subpage: 'form' });
    });

    expect(result.current.currentPage).toEqual(pages.home.subpages?.form);
  });

  it('exposes routeKey, currentRoute, currentSubpage, and canGoBack correctly', () => {
    const { result } = renderHook(() => useNavigator());

    expect(result.current.canGoBack).toBe(false);
    expect(result.current.currentRoute).toBe('home');
    expect(result.current.currentSubpage).toBeUndefined();
    expect(result.current.routeKey).toBe('home');

    act(() => {
      result.current.navigate('home', { subpage: 'form' });
    });

    expect(result.current.canGoBack).toBe(true);
    expect(result.current.currentRoute).toBe('home');
    expect(result.current.currentSubpage).toBe('form');
    expect(result.current.routeKey).toBe('home > home,form');

    act(() => {
      result.current.navigate('alarms');
    });

    expect(result.current.canGoBack).toBe(true);
    expect(result.current.currentRoute).toBe('alarms');
    expect(result.current.currentSubpage).toBeUndefined();
    expect(result.current.routeKey).toBe('home, home,form > alarms');
  });

  it('replace replaces the current page in-place without pushing to history stack', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
    });
    expect(result.current.currentPage).toEqual(pages.alarms);
    expect(result.current.pageKey).toBe('home');

    act(() => {
      result.current.replace('items');
    });
    expect(result.current.currentPage).toEqual(pages.items);
    // Stack is still just 'home', not 'home, alarms'
    expect(result.current.pageKey).toBe('home');

    act(() => {
      result.current.previous();
    });
    expect(result.current.currentPage).toEqual(pages.home);
    expect(result.current.noPreviousPages).toBe(true);
  });

  it('reset clears the history stack and sets the new root page', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
      result.current.navigate('items');
    });
    expect(result.current.noPreviousPages).toBe(false);

    act(() => {
      result.current.reset('alarms');
    });

    expect(result.current.currentPage).toEqual(pages.alarms);
    expect(result.current.noPreviousPages).toBe(true);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.pageKey).toBe('');
  });

  it('popToTop unwinds history back to the initial root screen', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
      result.current.navigate('items');
    });
    expect(result.current.noPreviousPages).toBe(false);

    act(() => {
      result.current.popToTop();
    });

    expect(result.current.currentPage).toEqual(pages.home);
    expect(result.current.noPreviousPages).toBe(true);
    expect(result.current.canGoBack).toBe(false);
  });

  it('blocks navigation when a navigation guard returns false', async () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
    });
    expect(result.current.currentPage).toEqual(pages.alarms);

    // Register a blocking guard
    let allowLeave = false;
    const unregister = registerNavigationGuard(() => allowLeave);

    act(() => {
      result.current.previous();
    });

    // Should still be on alarms because guard returned false
    expect(result.current.currentPage).toEqual(pages.alarms);

    // Allow leave and try again
    allowLeave = true;
    await act(async () => {
      result.current.previous();
    });

    expect(result.current.currentPage).toEqual(pages.home);
    unregister();
  });

  it('useNavigationGuard hook unregisters guard when component unmounts', async () => {
    const { result: navResult } = renderHook(() => useNavigator());

    act(() => {
      navResult.current.navigate('alarms');
    });

    const guardSpy = vi.fn().mockReturnValue(false);
    const { unmount } = renderHook(() => useNavigationGuard(guardSpy));

    act(() => {
      navResult.current.previous();
    });

    expect(guardSpy).toHaveBeenCalled();
    expect(navResult.current.currentPage).toEqual(pages.alarms);

    // Unmount the component holding the guard
    unmount();

    act(() => {
      navResult.current.previous();
    });

    // Now navigation succeeds
    expect(navResult.current.currentPage).toEqual(pages.home);
  });

  it('supports async navigation guards returning Promise<boolean>', async () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
    });
    expect(result.current.currentPage).toEqual(pages.alarms);

    let resolveGuard!: (allow: boolean) => void;
    const asyncGuard = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveGuard = resolve;
        }),
    );

    const unregister = registerNavigationGuard(asyncGuard);

    try {
      act(() => {
        result.current.previous();
      });

      expect(asyncGuard).toHaveBeenCalledTimes(1);

      // Guard resolves false -> navigation blocked
      await act(async () => {
        resolveGuard(false);
      });
      expect(result.current.currentPage).toEqual(pages.alarms);

      // Trigger previous again
      act(() => {
        result.current.previous();
      });

      expect(asyncGuard).toHaveBeenCalledTimes(2);

      // Guard resolves true -> navigation allowed
      await act(async () => {
        resolveGuard(true);
      });
      expect(result.current.currentPage).toEqual(pages.home);
    } finally {
      unregister();
    }
  });

  it('safely catches errors in navigation guards and aborts navigation', async () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
    });

    // Guard throwing a synchronous exception
    const syncThrowingGuard = vi.fn(() => {
      throw new Error('Guard synchronous crash');
    });
    let unregister = registerNavigationGuard(syncThrowingGuard);

    try {
      await act(async () => {
        result.current.previous();
      });
      expect(syncThrowingGuard).toHaveBeenCalledTimes(1);
      expect(result.current.currentPage).toEqual(pages.alarms);
    } finally {
      unregister();
    }

    // Guard returning a rejected promise
    let rejectGuard!: (err: Error) => void;
    const asyncRejectingGuard = vi.fn(
      () =>
        new Promise<boolean>((_, reject) => {
          rejectGuard = reject;
        }),
    );
    unregister = registerNavigationGuard(asyncRejectingGuard);

    try {
      act(() => {
        result.current.previous();
      });
      expect(asyncRejectingGuard).toHaveBeenCalledTimes(1);

      await act(async () => {
        rejectGuard(new Error('Guard async rejection'));
      });
      expect(result.current.currentPage).toEqual(pages.alarms);
    } finally {
      unregister();
    }

    // Now previous succeeds without guards
    act(() => {
      result.current.previous();
    });
    expect(result.current.currentPage).toEqual(pages.home);
  });

  it('evaluates multiple stacked navigation guards with short-circuiting', async () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
    });

    const guard1 = vi.fn().mockReturnValue(false);
    const guard2 = vi.fn().mockReturnValue(true);

    const unregister1 = registerNavigationGuard(guard1);
    const unregister2 = registerNavigationGuard(guard2);

    try {
      await act(async () => {
        result.current.previous();
      });

      // guard1 returned false, so guard2 should be short-circuited
      expect(guard1).toHaveBeenCalledTimes(1);
      expect(guard2).not.toHaveBeenCalled();
      expect(result.current.currentPage).toEqual(pages.alarms);

      // Change guard1 to pass, but guard2 fails
      guard1.mockReturnValue(true);
      guard2.mockReturnValue(false);

      await act(async () => {
        result.current.previous();
      });

      expect(guard1).toHaveBeenCalledTimes(2);
      expect(guard2).toHaveBeenCalledTimes(1);
      expect(result.current.currentPage).toEqual(pages.alarms);

      // Both pass
      guard2.mockReturnValue(true);

      await act(async () => {
        result.current.previous();
      });

      expect(result.current.currentPage).toEqual(pages.home);
    } finally {
      unregister1();
      unregister2();
    }
  });

  it('popToTop respects navigation guards and aborts when guard returns false', async () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
      result.current.navigate('items');
    });
    expect(result.current.currentPage).toEqual(pages.items);

    let allow = false;
    const guard = vi.fn(async () => allow);
    const unregister = registerNavigationGuard(guard);

    try {
      await act(async () => {
        result.current.popToTop();
      });

      expect(guard).toHaveBeenCalledTimes(1);
      expect(result.current.currentPage).toEqual(pages.items);
      expect(result.current.canGoBack).toBe(true);

      allow = true;
      await act(async () => {
        result.current.popToTop();
      });

      expect(guard).toHaveBeenCalledTimes(2);
      expect(result.current.currentPage).toEqual(pages.home);
      expect(result.current.canGoBack).toBe(false);
    } finally {
      unregister();
    }
  });

  it('popToTop is a safe no-op when already at the root page', () => {
    const { result } = renderHook(() => useNavigator());

    expect(result.current.noPreviousPages).toBe(true);
    expect(result.current.currentPage).toEqual(pages.home);

    act(() => {
      result.current.popToTop();
    });

    expect(result.current.noPreviousPages).toBe(true);
    expect(result.current.currentPage).toEqual(pages.home);
  });

  it('replace supports subpages and params and resets scrollTop', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.setScrollTop(300);
      result.current.replace('home', { subpage: 'form', params: { editId: '123' } });
    });

    expect(result.current.currentPage).toEqual(pages.home.subpages?.form);
    expect(result.current.currentRoute).toBe('home');
    expect(result.current.currentSubpage).toBe('form');
    expect(result.current.currentParams).toEqual({ editId: '123' });
    expect(result.current.scrollTop).toBe(0);
    expect(result.current.noPreviousPages).toBe(true);
  });

  it('reset supports subpages and params, resets scrollTop, and allows subsequent navigation', () => {
    const { result } = renderHook(() => useNavigator());

    act(() => {
      result.current.navigate('alarms');
      result.current.navigate('items');
      result.current.setScrollTop(150);
    });

    act(() => {
      result.current.reset('home', { subpage: 'form', params: { step: 2 } });
    });

    expect(result.current.currentPage).toEqual(pages.home.subpages?.form);
    expect(result.current.currentRoute).toBe('home');
    expect(result.current.currentSubpage).toBe('form');
    expect(result.current.currentParams).toEqual({ step: 2 });
    expect(result.current.scrollTop).toBe(0);
    expect(result.current.noPreviousPages).toBe(true);
    expect(result.current.canGoBack).toBe(false);

    // Subsequent navigation builds a clean new stack
    act(() => {
      result.current.navigate('items');
    });

    expect(result.current.currentPage).toEqual(pages.items);
    expect(result.current.noPreviousPages).toBe(false);
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.pageKey).toBe('home,form');
  });

  it('routeKey uniquely differentiates root and sibling subpage transitions', () => {
    const { result } = renderHook(() => useNavigator());

    // Root page routeKey is non-empty ('home') while legacy pageKey is ''
    expect(result.current.routeKey).toBe('home');
    expect(result.current.pageKey).toBe('');

    act(() => {
      result.current.navigate('home', { subpage: 'form' });
    });

    expect(result.current.routeKey).toBe('home > home,form');
    expect(result.current.pageKey).toBe('home');

    act(() => {
      result.current.previous();
    });

    // Back to root
    expect(result.current.routeKey).toBe('home');
    expect(result.current.pageKey).toBe('');

    act(() => {
      result.current.navigate('alarms');
    });

    expect(result.current.routeKey).toBe('home > alarms');
  });
});

