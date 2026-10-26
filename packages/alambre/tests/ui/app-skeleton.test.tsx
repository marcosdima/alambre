import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as UseLoopClockModule from '../../src/hooks/use-loop-clock';
import AppSkeleton from '../../src/ui/components/AppSkeleton';

const mocks = vi.hoisted(() => ({
  isStatic: false,
  clockValue: 0,
  useLoopClockCalls: [] as { duration: number; paused?: boolean }[],
}));

vi.mock('../../src/hooks/use-loop-clock', async (importOriginal) => {
  const actual = await importOriginal<typeof UseLoopClockModule>();
  return {
    ...actual,
    useLoopClock: vi.fn((opts: { duration: number; paused?: boolean }) => {
      mocks.useLoopClockCalls.push(opts);
      return {
        clock: { value: mocks.clockValue },
        isStatic: mocks.isStatic,
      };
    }),
  };
});

vi.mock('react-native-reanimated', async () => {
  const ReactActual = await import('react');
  const { View: RNView } = await import('react-native');

  const AnimatedView = ReactActual.forwardRef<unknown, any>(({ children, ...props }, ref) =>
    ReactActual.createElement(RNView, { ...props, ref: ref as any } as any, children),
  );

  return {
    default: {
      View: AnimatedView,
    },
    useAnimatedStyle: (cb: () => unknown) => cb(),
    useSharedValue: (initial: number) => {
      const ref = ReactActual.useRef({ value: initial });
      return ref.current;
    },
    useReducedMotion: () => false,
  };
});

describe('AppSkeleton component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isStatic = false;
    mocks.clockValue = 0;
    mocks.useLoopClockCalls = [];
  });

  describe('accessibility contracts', () => {
    it('declares accessible progressbar role and default loading label', async () => {
      const { getByRole } = await render(<AppSkeleton />);
      const skeleton = getByRole('progressbar');

      expect(skeleton).toBeDefined();
      expect(skeleton.props.accessibilityLabel).toBe('Loading content');
      expect(skeleton.props.accessible).toBe(true);
    });

    it('honors custom accessibilityLabel', async () => {
      const { getByLabelText } = await render(
        <AppSkeleton accessibilityLabel="Loading avatar image" />,
      );

      const skeleton = getByLabelText('Loading avatar image');
      expect(skeleton).toBeDefined();
      expect(skeleton.props.accessibilityRole).toBe('progressbar');
    });
  });

  describe('variant shape styling', () => {
    it('applies rect variant defaults (width 100%, height 48, radius 12)', async () => {
      const { getByRole } = await render(<AppSkeleton variant="rect" />);
      const flatStyle = StyleSheet.flatten(getByRole('progressbar').props.style);

      expect(flatStyle.width).toBe('100%');
      expect(flatStyle.height).toBe(48);
      expect(flatStyle.borderRadius).toBe(12);
    });

    it('applies text variant defaults (width 100%, height 14, radius 6)', async () => {
      const { getByRole } = await render(<AppSkeleton variant="text" />);
      const flatStyle = StyleSheet.flatten(getByRole('progressbar').props.style);

      expect(flatStyle.width).toBe('100%');
      expect(flatStyle.height).toBe(14);
      expect(flatStyle.borderRadius).toBe(6);
    });

    it('applies circle variant defaults (size 44x44, radius 999)', async () => {
      const { getByRole } = await render(<AppSkeleton variant="circle" />);
      const flatStyle = StyleSheet.flatten(getByRole('progressbar').props.style);

      expect(flatStyle.width).toBe(44);
      expect(flatStyle.height).toBe(44);
      expect(flatStyle.borderRadius).toBe(999);
    });

    it('derives equal dimensions in circle variant from width or height override', async () => {
      const { getByRole: getByRole1 } = await render(
        <AppSkeleton variant="circle" width={64} />,
      );
      const style1 = StyleSheet.flatten(getByRole1('progressbar').props.style);
      expect(style1.width).toBe(64);
      expect(style1.height).toBe(64);

      const { getByRole: getByRole2 } = await render(
        <AppSkeleton variant="circle" height={80} />,
      );
      const style2 = StyleSheet.flatten(getByRole2('progressbar').props.style);
      expect(style2.width).toBe(80);
      expect(style2.height).toBe(80);
    });

    it('applies pill variant defaults (width 100%, height 32, radius 999)', async () => {
      const { getByRole } = await render(<AppSkeleton variant="pill" />);
      const flatStyle = StyleSheet.flatten(getByRole('progressbar').props.style);

      expect(flatStyle.width).toBe('100%');
      expect(flatStyle.height).toBe(32);
      expect(flatStyle.borderRadius).toBe(999);
    });

    it('allows explicit width, height, radius, and container style overrides', async () => {
      const { getByRole } = await render(
        <AppSkeleton
          variant="rect"
          width={180}
          height={64}
          radius={20}
          style={{ marginVertical: 8, opacity: 0.9 }}
        />,
      );
      const flatStyle = StyleSheet.flatten(getByRole('progressbar').props.style);

      expect(flatStyle.width).toBe(180);
      expect(flatStyle.height).toBe(64);
      expect(flatStyle.borderRadius).toBe(20);
      expect(flatStyle.marginVertical).toBe(8);
    });
  });

  describe('animation and shared loop clock integration', () => {
    it('uses useLoopClock with clamped duration and active status', async () => {
      await render(<AppSkeleton duration={800} active={true} />);
      expect(mocks.useLoopClockCalls).toContainEqual({
        duration: 800,
        paused: false,
      });

      await render(<AppSkeleton duration={100} active={false} />);
      expect(mocks.useLoopClockCalls).toContainEqual({
        duration: 200, // Clamped to minimum 200ms
        paused: true,
      });
    });

    it('produces expected sinusoidal pulse opacity between 0.38 and 0.85 when active', async () => {
      // Phase 0: sin(-PI/2) = -1 => pulse = 0.38 + 0.47 * 0 = 0.38
      mocks.clockValue = 0;
      const render1 = await render(<AppSkeleton active={true} />);
      let style = StyleSheet.flatten(render1.getByRole('progressbar').props.style);
      expect(style.opacity).toBeCloseTo(0.38, 2);

      // Phase 0.5: sin(PI/2) = 1 => pulse = 0.38 + 0.47 * 1 = 0.85
      mocks.clockValue = 0.5;
      const render2 = await render(<AppSkeleton active={true} />);
      style = StyleSheet.flatten(render2.getByRole('progressbar').props.style);
      expect(style.opacity).toBeCloseTo(0.85, 2);
    });

    it('renders static 0.5 opacity when active is false', async () => {
      mocks.clockValue = 0.5;
      const { getByRole } = await render(<AppSkeleton active={false} />);
      const style = StyleSheet.flatten(getByRole('progressbar').props.style);
      expect(style.opacity).toBe(0.5);
    });

    it('renders static 0.5 opacity when reduced motion / isStatic is true', async () => {
      mocks.clockValue = 0.5;
      mocks.isStatic = true;
      const { getByRole } = await render(<AppSkeleton active={true} />);
      const style = StyleSheet.flatten(getByRole('progressbar').props.style);
      expect(style.opacity).toBe(0.5);
    });
  });
});
