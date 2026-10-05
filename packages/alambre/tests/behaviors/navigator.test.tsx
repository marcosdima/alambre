import { renderHook, act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackHandler, type NativeEventSubscription } from 'react-native';
import {
  initNavigator,
  useNavigator,
  NavigatorProvider,
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
});
