import { useState, useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';

export type UseDeckConfig<T> = {
  initialCards: T[];
};

export function useDeck<T>(config: UseDeckConfig<T>) {
  const { initialCards } = config;
  const [deck, setDeck] = useState<T[]>(initialCards);
  const [history, setHistory] = useState<T[]>([]);

  const swipeTranslation = useSharedValue(0);
  const activeIndex = useSharedValue(0);

  const popCard = useCallback((_direction: 'left' | 'right') => {
    const swipedIndex = Math.round(activeIndex.value);
    activeIndex.value = swipedIndex + 1;
    swipeTranslation.value = 0;

    if (swipedIndex < deck.length) {
      const top = deck[swipedIndex];
      setHistory((hist) => [top, ...hist]);
    }
  }, [activeIndex, deck, swipeTranslation]);

  const undoLast = useCallback(() => {
    if (history.length === 0) return;
    const [_last, ...restHistory] = history;
    setHistory(restHistory);
    if (activeIndex.value > 0) {
      const currentIndex = Math.round(activeIndex.value);
      activeIndex.value = currentIndex - 1;
    }
    swipeTranslation.value = 0;
  }, [history, activeIndex, swipeTranslation]);

  const triggerProgrammaticSwipe = useCallback((direction: 'left' | 'right') => {
    if (Math.round(activeIndex.value) >= deck.length) return;
    popCard(direction);
  }, [activeIndex, deck.length, popCard]);

  const reset = useCallback(() => {
    setDeck(initialCards);
    setHistory([]);
    activeIndex.value = 0;
    swipeTranslation.value = 0;
  }, [initialCards, activeIndex, swipeTranslation]);

  return {
    deck,
    history,
    activeIndex,
    swipeTranslation,
    popCard,
    undoLast,
    triggerProgrammaticSwipe,
    reset,
  };
}
