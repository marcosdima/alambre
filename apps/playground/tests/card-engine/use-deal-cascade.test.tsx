import React from 'react';
import { View } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { render, act } from '@testing-library/react-native';
import type { PlayingCardData, Point2D } from '../../src/views/card-game/types';
import {
  useDealCascade,
  type UseDealCascadeOptions,
  type UseDealCascadeReturn,
} from '../../src/views/card-game/hooks/use-deal-cascade';

function DealTestHarness({
  options,
  hookRef,
}: {
  options: UseDealCascadeOptions;
  hookRef: { current: UseDealCascadeReturn };
}) {
  hookRef.current = useDealCascade(options);
  return <View testID="deal-harness" />;
}

describe('useDealCascade Hook', () => {
  const deckOrigin: Point2D = { x: 40, y: 80 };
  const handCenter: Point2D = { x: 180, y: 360 };

  const sampleCards: PlayingCardData[] = [
    { id: 'c1', suit: 'spades', rank: 'A' },
    { id: 'c2', suit: 'hearts', rank: 'K' },
  ];

  it('initializes with idle state', async () => {
    const hookRef = { current: null as unknown as UseDealCascadeReturn };
    await render(
      <DealTestHarness options={{ deckOrigin, handCenter }} hookRef={hookRef} />,
    );

    expect(hookRef.current.activeFlights).toHaveLength(0);
    expect(hookRef.current.isDealing).toBe(false);
  });

  it('starts deal and populates active flight specs', async () => {
    const hookRef = { current: null as unknown as UseDealCascadeReturn };
    await render(
      <DealTestHarness
        options={{ deckOrigin, handCenter, staggerDelayMs: 80 }}
        hookRef={hookRef}
      />,
    );

    await act(async () => {
      hookRef.current.startDeal(sampleCards);
    });

    expect(hookRef.current.isDealing).toBe(true);
    expect(hookRef.current.activeFlights).toHaveLength(2);
    expect(hookRef.current.activeFlights[0]!.card.id).toBe('c1');
    expect(hookRef.current.activeFlights[1]!.card.id).toBe('c2');
  });

  it('fires onCardLanded and onCascadeComplete sequentially as cards land', async () => {
    const onCardLanded = vi.fn();
    const onCascadeComplete = vi.fn();

    const hookRef = { current: null as unknown as UseDealCascadeReturn };
    await render(
      <DealTestHarness
        options={{
          deckOrigin,
          handCenter,
          onCardLanded,
          onCascadeComplete,
        }}
        hookRef={hookRef}
      />,
    );

    await act(async () => {
      hookRef.current.startDeal(sampleCards);
    });

    // First card lands
    await act(async () => {
      hookRef.current.handleFlightComplete('c1');
    });

    expect(onCardLanded).toHaveBeenCalledTimes(1);
    expect(onCardLanded).toHaveBeenCalledWith(sampleCards[0], 0);
    expect(onCascadeComplete).not.toHaveBeenCalled();
    expect(hookRef.current.activeFlights).toHaveLength(1);
    expect(hookRef.current.isDealing).toBe(true);

    // Second card lands
    await act(async () => {
      hookRef.current.handleFlightComplete('c2');
    });

    expect(onCardLanded).toHaveBeenCalledTimes(2);
    expect(onCardLanded).toHaveBeenCalledWith(sampleCards[1], 1);
    expect(onCascadeComplete).toHaveBeenCalledTimes(1);
    expect(onCascadeComplete).toHaveBeenCalledWith(sampleCards);
    expect(hookRef.current.activeFlights).toHaveLength(0);
    expect(hookRef.current.isDealing).toBe(false);
  });

  it('cancels active deal immediately', async () => {
    const onCascadeComplete = vi.fn();

    const hookRef = { current: null as unknown as UseDealCascadeReturn };
    await render(
      <DealTestHarness
        options={{ deckOrigin, handCenter, onCascadeComplete }}
        hookRef={hookRef}
      />,
    );

    await act(async () => {
      hookRef.current.startDeal(sampleCards);
    });
    expect(hookRef.current.isDealing).toBe(true);

    await act(async () => {
      hookRef.current.cancelDeal();
    });

    expect(hookRef.current.activeFlights).toHaveLength(0);
    expect(hookRef.current.isDealing).toBe(false);
    expect(onCascadeComplete).not.toHaveBeenCalled();
  });
});
