import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  useStopwatch,
  formatStopwatchTime,
} from '../../src/hooks/use-stopwatch';

describe('formatStopwatchTime helper', () => {
  it('formats minutes and seconds correctly', () => {
    expect(formatStopwatchTime(0)).toBe('00:00');
    expect(formatStopwatchTime(5)).toBe('00:05');
    expect(formatStopwatchTime(65)).toBe('01:05');
    expect(formatStopwatchTime(599)).toBe('09:59');
  });

  it('includes hours when time exceeds 3600 seconds', () => {
    expect(formatStopwatchTime(3600)).toBe('01:00:00');
    expect(formatStopwatchTime(3665)).toBe('01:01:05');
  });

  it('handles negative or invalid seconds safely', () => {
    expect(formatStopwatchTime(-10)).toBe('00:00');
  });
});

describe('useStopwatch hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default options in paused state', () => {
    const { result } = renderHook(() => useStopwatch());
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.formattedTime).toBe('00:00');
  });

  it('tracks elapsed time when started', () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });
    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.seconds).toBe(3);
    expect(result.current.formattedTime).toBe('00:03');

    act(() => {
      result.current.pause();
    });
    expect(result.current.isRunning).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.seconds).toBe(3);
  });

  it('resets elapsed time', () => {
    const { result } = renderHook(() => useStopwatch({ autoStart: true }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.seconds).toBe(5);

    act(() => {
      result.current.reset(0);
    });
    expect(result.current.seconds).toBe(0);
  });

  it('respects initialSeconds option', () => {
    const { result } = renderHook(() =>
      useStopwatch({ initialSeconds: 120, autoStart: false }),
    );
    expect(result.current.seconds).toBe(120);
    expect(result.current.formattedTime).toBe('02:00');
  });
});
