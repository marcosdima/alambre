import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BackHandler, type NativeEventSubscription } from 'react-native';
import {
  NavigatorProvider,
  useNavigator,
} from '../../src/behaviors/navigator/navigator-provider';
import type { NavigatorTypes } from '../../src/types';

const pages: NavigatorTypes.NavigatorObject = {
  home: { component: null, subpages: { form: { component: null } } },
  alarms: { component: null },
  items: { component: null },
};

describe('NavigatorProvider', () => {
  const setup = () => {
    let api: NavigatorTypes.NavigatorReturn | undefined;

    const Consumer = () => {
      api = useNavigator();
      return null;
    };

    const rendered = render(
      <NavigatorProvider pages={pages}>
        <Consumer />
      </NavigatorProvider>,
    );

    return { ...rendered, getApi: () => api! };
  };

  it('starts on the first page with no previous pages', () => {
    const { getApi } = setup();

    expect(getApi().noPreviousPages).toBe(true);
    expect(getApi().pageKey).toBe('');
  });

  it('navigate pushes, previous returns', () => {
    const { getApi } = setup();

    act(() => getApi().navigate('alarms'));
    expect(getApi().noPreviousPages).toBe(false);

    act(() => getApi().previous());
    expect(getApi().noPreviousPages).toBe(true);
    expect(getApi().pageKey).toBe('');
  });

  it('navigating to the same page does not stack a phantom entry', () => {
    const { getApi } = setup();

    act(() => getApi().navigate('home'));
    expect(getApi().noPreviousPages).toBe(true);
    expect(getApi().pageKey).toBe('');
  });

  it('still navigates after a same-page no-op', () => {
    const { getApi } = setup();

    act(() => getApi().navigate('home'));
    act(() => getApi().navigate('alarms'));
    expect(getApi().noPreviousPages).toBe(false);

    act(() => getApi().previous());
    expect(getApi().noPreviousPages).toBe(true);
  });

  it('a subpage of the current page is a real navigation', () => {
    const { getApi } = setup();

    act(() => getApi().navigate('home', { subpage: 'form' }));
    expect(getApi().noPreviousPages).toBe(false);

    act(() => getApi().previous());
    expect(getApi().noPreviousPages).toBe(true);
  });

  it('registers BackHandler listener and navigates back on hardwareBackPress', () => {
    let backHandler: (() => boolean) | undefined;
    const addListenerSpy = vi.spyOn(BackHandler, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'hardwareBackPress') {
        backHandler = handler as () => boolean;
      }
      return { remove: vi.fn() } as unknown as NativeEventSubscription;
    });

    const { getApi, unmount } = setup();

    expect(addListenerSpy).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));

    // When on root, hardwareBackPress returns false (allowing OS exit)
    expect(backHandler?.()).toBe(false);

    // After navigating forward
    act(() => getApi().navigate('alarms'));
    expect(getApi().noPreviousPages).toBe(false);

    // hardwareBackPress returns true and navigates back
    act(() => {
      const handled = backHandler?.();
      expect(handled).toBe(true);
    });
    expect(getApi().noPreviousPages).toBe(true);
    expect(getApi().pageKey).toBe('');

    unmount();
    addListenerSpy.mockRestore();
  });
});
