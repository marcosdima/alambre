import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initNavigator,
  NavigatorHost,
} from '../../src/behaviors/navigator';
import type { NavigatorReturn } from '../../src/types/navigator';

vi.mock('react-native-reanimated', async () => {
  const ReactActual = await import('react');
  const { View: RNView, Text: RNText } = await import('react-native');

  const makeAnimation = () => {
    const anim: Record<string, unknown> = {};
    anim.duration = () => anim;
    anim.delay = () => anim;
    anim.easing = () => anim;
    anim.springify = () => anim;
    anim.damping = () => anim;
    anim.stiffness = () => anim;
    anim.withCallback = () => anim;
    return anim;
  };

  const AnimatedView = ReactActual.forwardRef<
    unknown,
    React.ComponentProps<typeof RNView>
  >(({ children, ...props }, ref) =>
    ReactActual.createElement(RNView, { ...props, ref: ref as never }, children),
  );
  const AnimatedText = ReactActual.forwardRef<
    unknown,
    React.ComponentProps<typeof RNText>
  >(({ children, ...props }, ref) =>
    ReactActual.createElement(RNText, { ...props, ref: ref as never }, children),
  );

  return {
    default: {
      View: AnimatedView,
      Text: AnimatedText,
      createAnimatedComponent: (Component: unknown) => Component,
    },
    useSharedValue: (value: unknown) => {
      const ref = ReactActual.useRef({ value });
      return ref.current;
    },
    useAnimatedStyle: (cb: () => unknown) => cb(),
    useAnimatedProps: (cb: () => unknown) => cb(),
    withTiming: (toValue: unknown) => toValue,
    withSpring: (toValue: unknown) => toValue,
    FadeIn: makeAnimation(),
    FadeInDown: makeAnimation(),
    Easing: {
      out: (fn: unknown) => fn,
      in: (fn: unknown) => fn,
      cubic: 'cubic',
      exp: 'exp',
      quad: 'quad',
    },
  };
});

vi.mock('react-native-svg', async () => {
  const React = await import('react');
  const { View } = await import('react-native');
  const host = (props: Record<string, unknown>) => React.createElement(View, props);
  return { default: host, Svg: host, Circle: host, Line: host, Path: host, G: host };
});

const createMockNavigator = (overrides?: Partial<NavigatorReturn>): NavigatorReturn => ({
  currentPage: { component: <Text testID="page-content">Home Content</Text> },
  pageKey: 'home',
  noPreviousPages: true,
  scrollTop: 0,
  navigate: vi.fn(),
  previous: vi.fn(),
  setScrollTop: vi.fn(),
  ...overrides,
});

describe('NavigatorHost', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    await act(async () => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders child/page components of current page', async () => {
    const mockNavigator = (): NavigatorReturn =>
      createMockNavigator({
        currentPage: { component: <Text testID="child-page">Hello Child Page</Text> },
      });

    const { getByTestId, getByText } = await render(
      <NavigatorHost useNavigator={mockNavigator} />,
    );

    expect(getByTestId('child-page')).toBeTruthy();
    expect(getByText('Hello Child Page')).toBeTruthy();
  });

  it('renders child components using default navigator initialization', async () => {
    initNavigator({
      main: { component: <Text testID="default-page">Default Initial Page</Text> },
    });

    const { getByTestId, getByText } = await render(<NavigatorHost />);

    expect(getByTestId('default-page')).toBeTruthy();
    expect(getByText('Default Initial Page')).toBeTruthy();
  });

  it('does not render the header bar when headerTitle is undefined', async () => {
    const mockNavigator = (): NavigatorReturn =>
      createMockNavigator({
        noPreviousPages: false,
        currentPage: { component: <Text>Page Without Header</Text> },
      });

    const { queryByText } = await render(
      <NavigatorHost useNavigator={mockNavigator} headerTitle={undefined} />,
    );

    expect(queryByText('Page Without Header')).toBeTruthy();
    expect(queryByText('Custom Title')).toBeNull();
  });

  it('renders the header with title when headerTitle is provided and noPreviousPages is false', async () => {
    const mockNavigator = (): NavigatorReturn =>
      createMockNavigator({
        noPreviousPages: false,
        currentPage: { component: <Text>Page With Header</Text> },
      });

    const { getByText } = await render(
      <NavigatorHost
        useNavigator={mockNavigator}
        headerTitle="Custom Header Title"
      />,
    );

    expect(getByText('Custom Header Title')).toBeTruthy();
    expect(getByText('Page With Header')).toBeTruthy();
  });

  it('disables and hides the arrow button when noPreviousPages is true', async () => {
    const mockNavigator = (): NavigatorReturn =>
      createMockNavigator({
        noPreviousPages: true,
      });

    const { getByLabelText } = await render(
      <NavigatorHost useNavigator={mockNavigator} />,
    );

    const backButton = getByLabelText('Volver');
    expect(backButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('does not render header bar when noPreviousPages is true even if headerTitle is defined', async () => {
    const mockNavigator = (): NavigatorReturn =>
      createMockNavigator({
        noPreviousPages: true,
      });

    const { queryByText, getByLabelText } = await render(
      <NavigatorHost useNavigator={mockNavigator} headerTitle="My Header" />,
    );

    expect(queryByText('My Header')).toBeNull();
    const backButton = getByLabelText('Volver');
    expect(backButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('triggers previous() when pressing the back button and noPreviousPages is false', async () => {
    const previousSpy = vi.fn();
    const mockNavigator = (): NavigatorReturn =>
      createMockNavigator({
        noPreviousPages: false,
        scrollTop: 0,
        previous: previousSpy,
      });

    const { getByLabelText } = await render(
      <NavigatorHost useNavigator={mockNavigator} />,
    );

    const backButton = getByLabelText('Volver');
    expect(backButton.props.accessibilityState?.disabled).toBeFalsy();

    await fireEvent(backButton, 'pressOut');

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(previousSpy).toHaveBeenCalledTimes(1);
  });

  it('triggers previous() when back button is pressed in header mode', async () => {
    const previousSpy = vi.fn();
    const mockNavigator = (): NavigatorReturn =>
      createMockNavigator({
        noPreviousPages: false,
        scrollTop: 0,
        previous: previousSpy,
      });

    const { getByLabelText, getByText } = await render(
      <NavigatorHost
        useNavigator={mockNavigator}
        headerTitle="Detail View"
      />,
    );

    expect(getByText('Detail View')).toBeTruthy();
    const backButton = getByLabelText('Volver');
    expect(backButton.props.accessibilityState?.disabled).toBeFalsy();

    await fireEvent(backButton, 'pressOut');

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(previousSpy).toHaveBeenCalledTimes(1);
  });

  it('allows injecting customNavigator via the useNavigator prop', async () => {
    const customNavigatorSpy = vi.fn((): NavigatorReturn => ({
      currentPage: { component: <Text testID="custom-injected">Custom Injected View</Text> },
      pageKey: 'injected-page',
      noPreviousPages: false,
      scrollTop: 0,
      navigate: vi.fn(),
      previous: vi.fn(),
      setScrollTop: vi.fn(),
    }));

    const { getByTestId, getByText } = await render(
      <NavigatorHost useNavigator={customNavigatorSpy} />,
    );

    expect(customNavigatorSpy).toHaveBeenCalled();
    expect(getByTestId('custom-injected')).toBeTruthy();
    expect(getByText('Custom Injected View')).toBeTruthy();
  });
});
