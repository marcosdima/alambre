import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppToast } from '../../src/ui/components/AppToast';
import type { Toast, ToastTone } from '../../src/behaviors/toast';

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
}));

vi.mock('react-native-reanimated', async () => {
  const ReactActual = await import('react');
  const { View: RNViewActual, Text: RNTextActual } = await import('react-native');

  const makeAnimation = () => {
    const anim: Record<string, unknown> = {};
    anim.duration = () => anim;
    anim.delay = () => anim;
    anim.easing = () => anim;
    return anim;
  };

  const AnimatedView = ReactActual.forwardRef<
    unknown,
    React.ComponentProps<typeof RNViewActual>
  >(({ children, ...props }, ref) =>
    ReactActual.createElement(RNViewActual, { ...props, ref: ref as never }, children),
  );
  const AnimatedText = ReactActual.forwardRef<
    unknown,
    React.ComponentProps<typeof RNTextActual>
  >(({ children, ...props }, ref) =>
    ReactActual.createElement(RNTextActual, { ...props, ref: ref as never }, children),
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
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    interpolate: vi.fn((_val: number, _inR: number[], outR: number[]) => outR[0]),
    Extrapolation: { CLAMP: 'clamp' },
    FadeInDown: makeAnimation(),
    FadeInUp: makeAnimation(),
    FadeOutUp: makeAnimation(),
    FadeOutDown: makeAnimation(),
    Easing: {
      out: (fn: unknown) => fn,
      in: (fn: unknown) => fn,
      linear: (t: number) => t,
      cubic: 'cubic',
    },
  };
});

vi.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Gesture: {
    Pan: () => {
      const builder = {
        onUpdate: () => builder,
        onEnd: () => builder,
      };
      return builder;
    },
  },
}));

vi.mock('react-native-svg', async () => {
  const React = await import('react');
  const { View } = await import('react-native');
  const host = (props: Record<string, unknown>) => React.createElement(View, props);
  return { default: host, Svg: host, Circle: host, Line: host, Path: host, Polyline: host };
});

describe('AppToast', () => {
  const createToast = (overrides?: Partial<Toast['data']>): Toast => ({
    data: {
      id: 'toast-ui-1',
      duration: 3000,
      payload: 'Toast message text',
      ...overrides,
    },
    startedAt: new Date(),
  });

  it('renders title and message content', async () => {
    const toast = createToast({
      payload: {
        title: 'Toast Title',
        content: 'Detailed body description',
      },
    });
    const dismiss = vi.fn();

    const { getByText } = await render(
      <AppToast
        toast={toast}
        dismiss={dismiss}
        clear={() => {}}
        next={() => undefined}
        queueLength={0}
      />,
    );

    expect(getByText('Toast Title')).toBeTruthy();
    expect(getByText('Detailed body description')).toBeTruthy();
  });

  it('invokes dismiss with toast id when close button is pressed', async () => {
    const toast = createToast();
    const dismiss = vi.fn();

    const { getByLabelText } = await render(
      <AppToast
        toast={toast}
        dismiss={dismiss}
        clear={() => {}}
        next={() => undefined}
        queueLength={0}
      />,
    );

    const closeBtn = getByLabelText('Dismiss toast');
    await act(async () => {
      fireEvent.press(closeBtn);
    });

    expect(dismiss).toHaveBeenCalledWith('toast-ui-1');
  });

  it('renders action buttons and handles user press', async () => {
    const onAction = vi.fn();
    const dismiss = vi.fn();
    const toast = createToast({
      actions: [
        { label: 'Retry Action', tone: 'primary', onPress: onAction },
      ],
    });

    const { getByText } = await render(
      <AppToast
        toast={toast}
        dismiss={dismiss}
        clear={() => {}}
        next={() => undefined}
        queueLength={0}
      />,
    );

    const btn = getByText('Retry Action');
    await act(async () => {
      fireEvent.press(btn);
    });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(dismiss).toHaveBeenCalledWith('toast-ui-1');
  });

  it('displays queue counter badge when queueLength > 0', async () => {
    const toast = createToast();

    const { getByText } = await render(
      <AppToast
        toast={toast}
        dismiss={() => {}}
        clear={() => {}}
        next={() => undefined}
        queueLength={3}
      />,
    );

    expect(getByText('+3')).toBeTruthy();
  });

  it.each(['success', 'warning', 'danger', 'info'] as ToastTone[])(
    'renders semantic tone %s correctly',
    async (tone) => {
      const toast = createToast({
        id: `toast-${tone}`,
        payload: { content: `${tone} toast message`, tone },
      });

      const { getByText } = await render(
        <AppToast
          toast={toast}
          dismiss={() => {}}
          clear={() => {}}
          next={() => undefined}
          queueLength={0}
        />,
      );

      expect(getByText(`${tone} toast message`)).toBeTruthy();
    },
  );
});
