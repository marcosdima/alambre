import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  calculateStaggerDelay,
  useStagger,
  StaggerProvider,
  useStaggerItem,
} from '../../src/hooks/use-stagger';

vi.mock('react-native-reanimated', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('calculateStaggerDelay', () => {
  it('calculates sequential delays using default initial and stagger values', () => {
    expect(calculateStaggerDelay(0)).toBe(60);
    expect(calculateStaggerDelay(1)).toBe(110);
    expect(calculateStaggerDelay(2)).toBe(160);
  });

  it('respects custom initialDelay and staggerMs options', () => {
    const opts = { initialDelay: 100, staggerMs: 40, maxDelay: 500 };
    expect(calculateStaggerDelay(0, opts)).toBe(100);
    expect(calculateStaggerDelay(1, opts)).toBe(140);
    expect(calculateStaggerDelay(2, opts)).toBe(180);
  });

  it('clamps delay to maxDelay', () => {
    const opts = { initialDelay: 50, staggerMs: 100, maxDelay: 200 };
    expect(calculateStaggerDelay(0, opts)).toBe(50);
    expect(calculateStaggerDelay(1, opts)).toBe(150);
    expect(calculateStaggerDelay(2, opts)).toBe(200);
    expect(calculateStaggerDelay(10, opts)).toBe(200);
  });

  it('returns 0 when reduced motion is enabled to avoid sluggish stalls', () => {
    const opts = { initialDelay: 100, staggerMs: 50 };
    expect(calculateStaggerDelay(0, opts, true)).toBe(0);
    expect(calculateStaggerDelay(1, opts, true)).toBe(0);
    expect(calculateStaggerDelay(5, opts, true)).toBe(0);
  });
});

describe('useStagger', () => {
  it('returns getDelay and isReducedMotion', () => {
    const { result } = renderHook(() => useStagger({ initialDelay: 80, staggerMs: 30 }));
    expect(result.current.isReducedMotion).toBe(false);
    expect(result.current.getDelay(0)).toBe(80);
    expect(result.current.getDelay(1)).toBe(110);
    expect(result.current.getDelay(2)).toBe(140);
  });
});

describe('StaggerProvider and useStaggerItem', () => {
  it('propagates stagger delay via provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StaggerProvider initialDelay={100} staggerMs={50}>
        {children}
      </StaggerProvider>
    );

    const { result } = renderHook(() => useStaggerItem(2), { wrapper });
    expect(result.current).toBe(200);
  });

  it('falls back to local calculation when provider is absent', () => {
    const { result } = renderHook(() => useStaggerItem(1, { initialDelay: 50, staggerMs: 20 }));
    expect(result.current).toBe(70);
  });
});
