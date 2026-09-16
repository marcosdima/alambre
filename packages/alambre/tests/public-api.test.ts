import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as Alambre from '../src/index';

vi.mock('react-native-reanimated', () => {
  const key = '__alambreIconSharedValues__';
  return {
    default: {
      createAnimatedComponent: (Component: unknown) => Component,
    },
    useSharedValue: (value: number) => {
      const box = { value };
      const g = globalThis as unknown as Record<string, { value: number }[]>;
      if (!g[key]) g[key] = [];
      g[key].push(box);
      return box;
    },
    withTiming: (toValue: number) => toValue,
    useAnimatedProps: (factory: () => unknown) => factory(),
  };
});

vi.mock('react-native-svg', async () => {
  const React = await import('react');
  const { View } = await import('react-native');
  const host = (props: Record<string, unknown>) => React.createElement(View, props);
  return { default: host, Svg: host, Circle: host, Line: host };
});

describe('public API — value surface', () => {
  it('exposes the intentional value contracts', () => {
    expect(typeof Alambre.Button).toBe('function');
    expect(typeof Alambre.createConfigProvider).toBe('function');
    expect(typeof Alambre.createLangProvider).toBe('function');
    expect(typeof Alambre.createLightDarkProvider).toBe('function');
    expect(typeof Alambre.createCollectionProvider).toBe('function');
    expect(typeof Alambre.createApiProvider).toBe('function');
    expect(typeof Alambre.NavigatorProvider).toBe('function');
    expect(typeof Alambre.useNavigator).toBe('function');
    expect(typeof Alambre.ToastProvider).toBe('function');
    expect(typeof Alambre.useToast).toBe('function');
    expect(typeof Alambre.ConfirmProvider).toBe('function');
    expect(typeof Alambre.useConfirm).toBe('function');
    expect(typeof Alambre.createStorage).toBe('function');
    expect(typeof Alambre.getJson).toBe('function');
    expect(typeof Alambre.setJson).toBe('function');
    expect(typeof Alambre.removeJson).toBe('function');
    expect(typeof Alambre.readCollection).toBe('function');
    expect(typeof Alambre.writeCollection).toBe('function');
    expect(typeof Alambre.AlambreIcons).toBe('object');
  });

  it('exposes the icon family alongside its low-level primitives', () => {
    const { AlambreIcons } = Alambre;
    expect(typeof AlambreIcons.Arrow).toBe('function');
    expect(typeof AlambreIcons.Cross).toBe('function');
    expect(typeof AlambreIcons.Tick).toBe('function');
    expect(typeof AlambreIcons.Sun).toBe('function');
    expect(typeof AlambreIcons.Moon).toBe('function');
    expect(typeof AlambreIcons.Circle).toBe('function');
    expect(typeof AlambreIcons.Line).toBe('function');
  });
});

describe('public API — type surface', () => {
  it('promotes Storage, IconAnimationConfig and IconProps as first-class contracts', () => {
    const storage: Alambre.Storage = {
      get: async () => null,
      set: async () => undefined,
      remove: async () => undefined,
    };
    const iconAnimation: Alambre.IconAnimationConfig = {
      drawAnimation: (value) => value,
      resetAnimation: (value) => value,
      fillOpacity: 1,
      strokeDasharray: 100,
    };
    const iconProps: Alambre.IconProps = {
      drawIt: true,
      rotation: 90,
      strokeOffset: 10,
      iconAnimation,
    };

    const circle: ComponentProps<typeof Alambre.AlambreIcons.Circle> = {
      circle: { cx: 50, cy: 50, r: 35 },
      drawIt: true,
      iconAnimation,
    };
    const line: ComponentProps<typeof Alambre.AlambreIcons.Line> = {
      line: { x1: 0, y1: 0, x2: 10, y2: 10 },
      iconAnimation,
    };

    expect(storage).toBeDefined();
    expect(iconAnimation).toBeDefined();
    expect(iconProps).toBeDefined();
    expect(circle).toBeDefined();
    expect(line).toBeDefined();
  });

  it('keeps the existing consumer-facing type contracts', () => {
    const buttonProps: Alambre.ButtonProps = { onPress: () => undefined };
    const buttonState: Alambre.ButtonState = {
      pressed: false,
      disabled: false,
      loading: false,
    };
    const toastComponentProps: Alambre.ToastComponentProps = {
      toast: { data: { id: 'toast', duration: 1000 }, startedAt: new Date() },
      dismiss: () => undefined,
      clear: () => undefined,
      next: () => undefined,
      queueLength: 0,
    };
    const confirmComponentProps: Alambre.ConfirmComponentProps = {
      confirm: { title: 'Sure?', confirmLabel: 'Delete' },
      onConfirm: () => undefined,
      onCancel: () => undefined,
    };
    const page: Alambre.NavigatorTypes.Page = { component: null };

    expect(buttonProps).toBeDefined();
    expect(buttonState).toBeDefined();
    expect(toastComponentProps).toBeDefined();
    expect(confirmComponentProps).toBeDefined();
    expect(page).toBeDefined();
  });

  it('does not expose internal/plumbing namespaces', () => {
    // @ts-expect-error DefaultReact must not be public API.
    void Alambre.DefaultReact;
    // @ts-expect-error ActionTypes must not be public API.
    void Alambre.ActionTypes;
    // @ts-expect-error HooksTypes must not be public API.
    void Alambre.HooksTypes;
    // @ts-expect-error IconstTypes must not be public API.
    void Alambre.IconstTypes;
    // @ts-expect-error AnimadoTypes must not be public API (moved to the application).
    void Alambre.AnimadoTypes;
    // @ts-expect-error AnimadoView must not be public API (moved to the application).
    void Alambre.AnimadoView;
    // @ts-expect-error BaseModule must not be public API (internal core).
    void Alambre.BaseModule;
    // @ts-expect-error createModuleProvider must not be public API (internal core).
    void Alambre.createModuleProvider;
  });
});
