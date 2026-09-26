import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCollapsible } from '../../src/hooks/use-collapsible';

vi.mock('react-native-reanimated', () => ({
  useReducedMotion: vi.fn(() => false),
  useSharedValue: vi.fn((val: number) => ({ value: val })),
  useAnimatedStyle: vi.fn((cb: () => unknown) => cb()),
  withTiming: vi.fn((val: number) => val),
  withSpring: vi.fn((val: number) => val),
  Easing: {
    out: vi.fn((fn: unknown) => fn),
    cubic: vi.fn(),
  },
}));

describe('useCollapsible hook contract', () => {
  it('initializes with default collapsed state', () => {
    const { result } = renderHook(() => useCollapsible());
    expect(result.current.isExpanded).toBe(false);
    expect(result.current.measuredHeight).toBe(0);
    expect(result.current.probeProps.pointerEvents).toBe('none');
  });

  it('respects defaultExpanded option', () => {
    const { result } = renderHook(() => useCollapsible({ defaultExpanded: true }));
    expect(result.current.isExpanded).toBe(true);
  });

  it('toggles expansion state in uncontrolled mode', () => {
    const onToggle = vi.fn();
    const { result } = renderHook(() => useCollapsible({ onToggle }));

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isExpanded).toBe(true);
    expect(onToggle).toHaveBeenCalledWith(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isExpanded).toBe(false);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('respects controlled expanded prop', () => {
    const { result, rerender } = renderHook(
      ({ expanded }: { expanded: boolean }) => useCollapsible({ expanded }),
      { initialProps: { expanded: false } },
    );

    expect(result.current.isExpanded).toBe(false);

    rerender({ expanded: true });
    expect(result.current.isExpanded).toBe(true);
  });

  it('records content layout height from event', () => {
    const { result } = renderHook(() => useCollapsible());

    act(() => {
      result.current.handleContentLayout({
        nativeEvent: {
          layout: { x: 0, y: 0, width: 300, height: 142 },
        },
      } as any);
    });

    expect(result.current.measuredHeight).toBe(142);
  });
});
