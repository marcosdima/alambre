import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
