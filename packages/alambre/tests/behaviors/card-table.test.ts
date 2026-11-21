import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCardTable } from '../../src/behaviors/cards/useCardTable';

describe('useCardTable behavior & zone mechanics', () => {
  const SAMPLE_CARDS = [
    { id: 'c1', rank: 'A', value: 14 },
    { id: 'c2', rank: 'K', value: 13 },
    { id: 'c3', rank: 'Q', value: 12 },
    { id: 'c4', rank: 'J', value: 11 },
    { id: 'c5', rank: '10', value: 10 },
    { id: 'c6', rank: '9', value: 9 },
    { id: 'c7', rank: '8', value: 8 },
    { id: 'c8', rank: '7', value: 7 },
  ];

  it('initializes with all cards in deck and empty hand/discard', () => {
    const { result } = renderHook(() =>
      useCardTable({
        initialCards: SAMPLE_CARDS,
        totalCapacity: 5,
      }),
    );

    expect(result.current.deckCards).toHaveLength(8);
    expect(result.current.handCards).toHaveLength(0);
    expect(result.current.discardCards).toHaveLength(0);
    expect(result.current.selectedId).toBeNull();
  });

  it('deals cards from deck to hand up to capacity with staggered delays', () => {
    const { result } = renderHook(() =>
      useCardTable({
        initialCards: SAMPLE_CARDS,
        totalCapacity: 5,
        defaultStaggerMs: 80,
      }),
    );

    act(() => {
      result.current.deal(4);
    });

    expect(result.current.deckCards).toHaveLength(4);
    expect(result.current.handCards).toHaveLength(4);
    expect(result.current.handCards.map((c) => c.id)).toEqual(['c1', 'c2', 'c3', 'c4']);
    expect(result.current.flyingCardIds.size).toBe(4);
    expect(result.current.cardDelays.c1).toBe(0);
    expect(result.current.cardDelays.c2).toBe(80);
    expect(result.current.cardDelays.c3).toBe(160);
    expect(result.current.cardDelays.c4).toBe(240);
  });

  it('draws a single card from deck to hand', () => {
    const { result } = renderHook(() =>
      useCardTable({
        initialCards: SAMPLE_CARDS,
        totalCapacity: 5,
      }),
    );

    act(() => {
      result.current.draw();
    });

    expect(result.current.deckCards).toHaveLength(7);
    expect(result.current.handCards).toHaveLength(1);
    expect(result.current.handCards[0].id).toBe('c1');
    expect(result.current.flyingCardIds.has('c1')).toBe(true);
  });

  it('discards a selected card from hand to discard pile', () => {
    const { result } = renderHook(() =>
      useCardTable({
        initialCards: SAMPLE_CARDS,
        totalCapacity: 5,
      }),
    );

    act(() => {
      result.current.deal(3);
    });

    act(() => {
      result.current.select('c2');
    });

    expect(result.current.selectedId).toBe('c2');

    act(() => {
      result.current.discard();
    });

    expect(result.current.handCards.map((c) => c.id)).toEqual(['c1', 'c3']);
    expect(result.current.discardCards.map((c) => c.id)).toEqual(['c2']);
    expect(result.current.selectedId).toBeNull();
  });

  it('sorts hand cards using a custom comparator', () => {
    const { result } = renderHook(() =>
      useCardTable({
        initialCards: SAMPLE_CARDS,
        totalCapacity: 5,
      }),
    );

    act(() => {
      result.current.deal(4);
    });

    expect(result.current.handCards.map((c) => c.value)).toEqual([14, 13, 12, 11]);

    act(() => {
      result.current.sortHand((a, b) => a.value - b.value);
    });

    expect(result.current.handCards.map((c) => c.value)).toEqual([11, 12, 13, 14]);
  });

  it('resets the table restoring all cards to the deck', () => {
    const { result } = renderHook(() =>
      useCardTable({
        initialCards: SAMPLE_CARDS,
        totalCapacity: 5,
      }),
    );

    act(() => {
      result.current.deal(3);
    });
    act(() => {
      result.current.discard('c1');
    });

    expect(result.current.handCards).toHaveLength(2);
    expect(result.current.discardCards).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.deckCards).toHaveLength(8);
    expect(result.current.handCards).toHaveLength(0);
    expect(result.current.discardCards).toHaveLength(0);
    expect(result.current.selectedId).toBeNull();
  });

  it('computes responsive hand slot coordinates', () => {
    const { result } = renderHook(() =>
      useCardTable({
        initialCards: SAMPLE_CARDS,
        totalCapacity: 5,
        arenaWidth: 400,
        arenaHeight: 300,
      }),
    );

    act(() => {
      result.current.deal(3);
    });

    expect(result.current.handSlots).toHaveLength(3);
    result.current.handSlots.forEach((slot) => {
      expect(typeof slot.centerCoord.x).toBe('number');
      expect(typeof slot.centerCoord.y).toBe('number');
      expect(typeof slot.rotateDeg).toBe('number');
      expect(typeof slot.zIndex).toBe('number');
    });
  });
});
