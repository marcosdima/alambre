import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInteractiveHand } from '../../src/hooks/use-interactive-hand';

describe('useInteractiveHand hook', () => {
  const initialCards = [
    { id: 'c1', label: '10 of Spades' },
    { id: 'c2', label: 'Jack of Hearts' },
    { id: 'c3', label: 'Queen of Diamonds' },
  ];

  it('synchronously reconciles external reordering (Auto-Sort) during render without 1-frame lag', () => {
    let currentCards = [...initialCards];
    const { result, rerender } = renderHook(
      ({ cards }) => useInteractiveHand({ items: cards }),
      { initialProps: { cards: currentCards } },
    );

    expect(result.current.items.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);

    // Trigger external sort (e.g. by rank: c3, c2, c1)
    currentCards = [initialCards[2], initialCards[1], initialCards[0]];
    rerender({ cards: currentCards });

    // Must be updated synchronously
    expect(result.current.items.map((c) => c.id)).toEqual(['c3', 'c2', 'c1']);
  });

  it('preserves user ordering when new items are added or removed', () => {
    let currentCards = [...initialCards];
    const { result, rerender } = renderHook(
      ({ cards }) => useInteractiveHand({ items: cards }),
      { initialProps: { cards: currentCards } },
    );

    // User manually drags c3 to the front
    act(() => {
      result.current.reorder(2, 0);
    });
    expect(result.current.items.map((c) => c.id)).toEqual(['c3', 'c1', 'c2']);

    // A new card is drawn into the hand
    const drawnCard = { id: 'c4', label: 'King of Clubs' };
    currentCards = [...currentCards, drawnCard];
    rerender({ cards: currentCards });

    // Existing user-ordered cards preserve order, and the new card is appended
    expect(result.current.items.map((c) => c.id)).toEqual(['c3', 'c1', 'c2', 'c4']);

    // A card (c1) is discarded
    currentCards = currentCards.filter((c) => c.id !== 'c1');
    rerender({ cards: currentCards });

    expect(result.current.items.map((c) => c.id)).toEqual(['c3', 'c2', 'c4']);
  });

  it('supports totalCapacity to lock fan geometry during progressive arrivals', () => {
    const { result, rerender } = renderHook(
      ({ cards, capacity }) =>
        useInteractiveHand({
          items: cards,
          totalCapacity: capacity,
          fanOptions: { containerWidth: 400 },
        }),
      { initialProps: { cards: [initialCards[0]], capacity: 7 } },
    );

    const initialCard0X = result.current.slots[0].translateX;
    expect(result.current.fan.slots).toHaveLength(1);
    expect(result.current.fan.reservedSlots).toHaveLength(6);

    // Add second card with same totalCapacity
    rerender({ cards: [initialCards[0], initialCards[1]], capacity: 7 });

    // Card 0 must remain at the exact same position
    expect(result.current.slots[0].translateX).toBe(initialCard0X);
    expect(result.current.fan.slots).toHaveLength(2);
    expect(result.current.fan.reservedSlots).toHaveLength(5);
  });

  it('maintains referential stability for handler functions', () => {
    const { result, rerender } = renderHook(() =>
      useInteractiveHand({ items: initialCards }),
    );

    const firstSelect = result.current.select;
    const firstToggle = result.current.toggleSelect;
    const firstReorder = result.current.reorder;
    const firstBeginDrag = result.current.beginDrag;

    rerender();

    expect(result.current.reorder).toBe(firstReorder);
    expect(result.current.beginDrag).toBe(firstBeginDrag);
  });
});
