import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCascadeFlight } from '../../src/hooks/use-cascade-flight';

describe('useCascadeFlight hook', () => {
  const cards = [
    { id: 'c1', label: 'Card 1' },
    { id: 'c2', label: 'Card 2' },
  ];

  it('guarantees referential stability of returned methods', () => {
    const { result, rerender } = renderHook(() =>
      useCascadeFlight({
        origin: { x: 100, y: 100 },
        targetCenter: { x: 200, y: 400 },
      }),
    );

    const firstStartDeal = result.current.startDeal;
    const firstCancelDeal = result.current.cancelDeal;
    const firstHandleFlightComplete = result.current.handleFlightComplete;

    rerender();

    expect(result.current.startDeal).toBe(firstStartDeal);
    expect(result.current.cancelDeal).toBe(firstCancelDeal);
    expect(result.current.handleFlightComplete).toBe(firstHandleFlightComplete);
  });

  it('safely handles cancelDeal without state updates when no flights are active', () => {
    const { result } = renderHook(() =>
      useCascadeFlight({
        origin: { x: 100, y: 100 },
        targetCenter: { x: 200, y: 400 },
      }),
    );

    // Calling cancelDeal when idle should be safe and a no-op
    act(() => {
      result.current.cancelDeal();
      result.current.cancelDeal();
    });

    expect(result.current.isDealing).toBe(false);
    expect(result.current.activeFlights).toHaveLength(0);
  });

  it('starts and manages cascade flights', () => {
    const onItemLanded = vi.fn();
    const onCascadeComplete = vi.fn();

    const { result } = renderHook(() =>
      useCascadeFlight({
        origin: { x: 100, y: 100 },
        targetCenter: { x: 200, y: 400 },
        onItemLanded,
        onCascadeComplete,
      }),
    );

    act(() => {
      result.current.startDeal(cards);
    });

    expect(result.current.isDealing).toBe(true);
    expect(result.current.activeFlights).toHaveLength(2);

    // Complete first flight
    act(() => {
      result.current.handleFlightComplete('c1');
    });

    expect(onItemLanded).toHaveBeenCalledWith(cards[0], 0);
    expect(result.current.activeFlights).toHaveLength(1);
    expect(result.current.isDealing).toBe(true);

    // Complete second flight
    act(() => {
      result.current.handleFlightComplete('c2');
    });

    expect(onItemLanded).toHaveBeenCalledWith(cards[1], 1);
    expect(result.current.activeFlights).toHaveLength(0);
    expect(result.current.isDealing).toBe(false);
    expect(onCascadeComplete).toHaveBeenCalledWith(cards);
  });

  it('unmounts cleanly without throwing or triggering update loops', () => {
    const { result, unmount } = renderHook(() =>
      useCascadeFlight({
        origin: { x: 100, y: 100 },
        targetCenter: { x: 200, y: 400 },
      }),
    );

    act(() => {
      result.current.startDeal(cards);
    });

    expect(result.current.isDealing).toBe(true);

    // Unmount while dealing
    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
