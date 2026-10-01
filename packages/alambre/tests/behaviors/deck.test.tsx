import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDeck } from '../../src/behaviors/deck';

import { useRef } from 'react';

vi.mock('react-native-reanimated', () => ({
  useSharedValue: (val: unknown) => {
    const ref = useRef({ value: val });
    return ref.current;
  },
}));

describe('useDeck hook behavior & stack mechanics', () => {
  it('initializes with given cards, empty history, and activeIndex 0', () => {
    const cards = ['card-1', 'card-2', 'card-3'];
    const { result } = renderHook(() => useDeck({ initialCards: cards }));

    expect(result.current.deck).toEqual(cards);
    expect(result.current.history).toEqual([]);
    expect(result.current.activeIndex.value).toBe(0);
    expect(result.current.swipeTranslation.value).toBe(0);
  });

  it('popCard increments activeIndex and records the popped card in history', () => {
    const cards = ['A', 'B', 'C'];
    const { result } = renderHook(() => useDeck({ initialCards: cards }));

    act(() => {
      result.current.popCard('right');
    });

    expect(result.current.activeIndex.value).toBe(1);
    expect(result.current.history).toEqual(['A']);

    act(() => {
      result.current.popCard('left');
    });

    expect(result.current.activeIndex.value).toBe(2);
    expect(result.current.history).toEqual(['B', 'A']);
  });

  it('undoLast restores the previous card and decrements activeIndex', () => {
    const cards = ['A', 'B', 'C'];
    const { result } = renderHook(() => useDeck({ initialCards: cards }));

    act(() => {
      result.current.popCard('right');
    });
    act(() => {
      result.current.popCard('left');
    });

    expect(result.current.activeIndex.value).toBe(2);
    expect(result.current.history).toEqual(['B', 'A']);

    act(() => {
      result.current.undoLast();
    });

    expect(result.current.activeIndex.value).toBe(1);
    expect(result.current.history).toEqual(['A']);

    act(() => {
      result.current.undoLast();
    });

    expect(result.current.activeIndex.value).toBe(0);
    expect(result.current.history).toEqual([]);

    // Extra undo on empty history does nothing
    act(() => {
      result.current.undoLast();
    });
    expect(result.current.activeIndex.value).toBe(0);
    expect(result.current.history).toEqual([]);
  });

  it('triggerProgrammaticSwipe pops cards until the deck is exhausted', () => {
    const cards = ['1', '2'];
    const { result } = renderHook(() => useDeck({ initialCards: cards }));

    act(() => {
      result.current.triggerProgrammaticSwipe('right');
    });
    expect(result.current.activeIndex.value).toBe(1);
    expect(result.current.history).toEqual(['1']);

    act(() => {
      result.current.triggerProgrammaticSwipe('left');
    });
    expect(result.current.activeIndex.value).toBe(2);
    expect(result.current.history).toEqual(['2', '1']);

    // When activeIndex >= deck.length, programmatic swipe is ignored
    act(() => {
      result.current.triggerProgrammaticSwipe('right');
    });
    expect(result.current.activeIndex.value).toBe(2);
    expect(result.current.history).toEqual(['2', '1']);
  });

  it('reset restores initial state cleanly', () => {
    const cards = ['X', 'Y', 'Z'];
    const { result } = renderHook(() => useDeck({ initialCards: cards }));

    act(() => {
      result.current.popCard('left');
      result.current.popCard('right');
    });

    expect(result.current.activeIndex.value).toBe(2);
    expect(result.current.history.length).toBe(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.deck).toEqual(cards);
    expect(result.current.history).toEqual([]);
    expect(result.current.activeIndex.value).toBe(0);
    expect(result.current.swipeTranslation.value).toBe(0);
  });

  it('handles empty deck gracefully', () => {
    const { result } = renderHook(() => useDeck({ initialCards: [] }));

    expect(result.current.deck).toEqual([]);
    expect(result.current.history).toEqual([]);
    expect(result.current.activeIndex.value).toBe(0);

    act(() => {
      result.current.triggerProgrammaticSwipe('left');
      result.current.undoLast();
      result.current.reset();
    });

    expect(result.current.activeIndex.value).toBe(0);
    expect(result.current.history).toEqual([]);
  });
});
