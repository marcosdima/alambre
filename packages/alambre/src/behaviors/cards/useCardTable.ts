import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { calculateResponsiveHandFan } from '../../core/spatial';
import type {
  BaseCardItem,
  UseCardTableConfig,
  UseCardTableReturn,
  HandSlot,
} from './types';

export function useCardTable<T extends BaseCardItem>(
  config: UseCardTableConfig<T>,
): UseCardTableReturn<T> {
  const {
    initialCards,
    totalCapacity = 7,
    deckPosition,
    discardPosition,
    handCenter: customHandCenter,
    arenaWidth: initialArenaWidth = 360,
    arenaHeight: initialArenaHeight = 320,
    spreadAngle = 16,
    arcCurvature = 12,
    baseSpacing = 38,
    defaultFlightDuration = 340,
    defaultStaggerMs = 90,
  } = config;

  const [allCards] = useState<T[]>(() => [...initialCards]);
  const [deckCards, setDeckCards] = useState<T[]>(() => [...initialCards]);
  const [handCards, setHandCards] = useState<T[]>([]);
  const [discardCards, setDiscardCards] = useState<T[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [arenaWidth, setArenaWidth] = useState(initialArenaWidth);
  const [arenaHeight] = useState(initialArenaHeight);
  const [flightDurationMs, setFlightDurationMs] = useState(defaultFlightDuration);
  const [staggerMs, setStaggerMs] = useState(defaultStaggerMs);

  const [flyingCardIds, setFlyingCardIds] = useState<Set<string>>(new Set());
  const [cardDelays, setCardDelays] = useState<Record<string, number>>({});

  // Dynamic Anchor Points
  const deckPos = useMemo(() => {
    return deckPosition ?? { x: 50, y: 55 };
  }, [deckPosition]);

  const discardPos = useMemo(() => {
    return discardPosition ?? { x: arenaWidth - 50, y: 55 };
  }, [discardPosition, arenaWidth]);

  const handCenter = useMemo(() => {
    return customHandCenter ?? { x: arenaWidth / 2, y: arenaHeight - 65 };
  }, [customHandCenter, arenaWidth, arenaHeight]);

  // Compute magnetic hand slots
  const handFan = useMemo(() => {
    return calculateResponsiveHandFan(handCards, {
      containerWidth: arenaWidth - 32,
      centerOffset: handCenter,
      baseSpacing,
      spreadAngle,
      arcCurvature,
      totalCapacity,
    });
  }, [handCards, arenaWidth, handCenter, baseSpacing, spreadAngle, arcCurvature, totalCapacity]);

  const handSlots: HandSlot[] = useMemo(() => {
    return handFan.slots.map((s) => ({
      centerCoord: s.centerCoord,
      rotateDeg: s.rotateDeg,
      zIndex: s.zIndex,
    }));
  }, [handFan.slots]);

  // Cleanup flight state after animation completes
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (flyingCardIds.size === 0) return;

    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    const maxDelay = Math.max(0, ...Object.values(cardDelays));
    clearTimerRef.current = setTimeout(() => {
      setFlyingCardIds(new Set());
      setCardDelays({});
    }, maxDelay + flightDurationMs + 30);

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [flyingCardIds, cardDelays, flightDurationMs]);

  // Deal cards from deck into hand
  const deal = useCallback(
    (count = totalCapacity, customStagger = staggerMs) => {
      if (deckCards.length === 0 || count <= 0) return;
      setSelectedId(null);

      const dealCount = Math.min(count, deckCards.length, totalCapacity - handCards.length);
      if (dealCount <= 0) return;

      const itemsToDeal = deckCards.slice(0, dealCount);
      const remainingDeck = deckCards.slice(dealCount);

      const delays: Record<string, number> = {};
      itemsToDeal.forEach((c, idx) => {
        delays[c.id] = idx * customStagger;
      });

      setDeckCards(remainingDeck);
      setHandCards((prev) => [...prev, ...itemsToDeal]);
      setFlyingCardIds(new Set(itemsToDeal.map((c) => c.id)));
      setCardDelays(delays);
    },
    [deckCards, handCards.length, totalCapacity, staggerMs],
  );

  // Draw 1 card from deck into hand
  const draw = useCallback(() => {
    if (deckCards.length === 0 || handCards.length >= totalCapacity) return;

    const drawnCard = deckCards[0];
    const remainingDeck = deckCards.slice(1);

    setDeckCards(remainingDeck);
    setHandCards((prev) => [...prev, drawnCard]);
    setFlyingCardIds(new Set([drawnCard.id]));
    setCardDelays({ [drawnCard.id]: 0 });
  }, [deckCards, handCards.length, totalCapacity]);

  // Discard a card from hand to discard pile
  const discard = useCallback(
    (cardId?: string) => {
      const targetId = cardId ?? selectedId;
      if (!targetId) return;

      const cardToDiscard = handCards.find((c) => c.id === targetId);
      if (!cardToDiscard) return;

      setHandCards((prev) => prev.filter((c) => c.id !== targetId));
      setDiscardCards((prev) => [...prev, cardToDiscard]);
      setFlyingCardIds(new Set([targetId]));
      setCardDelays({ [targetId]: 0 });

      if (selectedId === targetId) {
        setSelectedId(null);
      }
    },
    [selectedId, handCards],
  );

  // Auto-Sort hand cards (smooth magnetic equilibrium rearrangement)
  const sortHand = useCallback(
    (comparator?: (a: T, b: T) => number) => {
      if (handCards.length <= 1) return;
      setHandCards((prev) => {
        const sorted = [...prev];
        if (comparator) {
          sorted.sort(comparator);
        } else {
          sorted.sort((a, b) => a.id.localeCompare(b.id));
        }
        return sorted;
      });
      setFlyingCardIds(new Set());
      setCardDelays({});
    },
    [handCards.length],
  );

  // Select/Deselect a card
  const select = useCallback((cardId: string | null) => {
    setSelectedId((prev) => (prev === cardId ? null : cardId));
  }, []);

  // Reset entire table to initial state
  const reset = useCallback(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    setSelectedId(null);
    setDeckCards([...initialCards]);
    setHandCards([]);
    setDiscardCards([]);
    setFlyingCardIds(new Set());
    setCardDelays({});
  }, [initialCards]);

  return {
    allCards,
    deckCards,
    handCards,
    discardCards,
    selectedId,
    flyingCardIds,
    cardDelays,
    flightDurationMs,
    staggerMs,
    arenaWidth,
    arenaHeight,
    deckPos,
    discardPos,
    handCenter,
    handSlots,
    deal,
    draw,
    discard,
    sortHand,
    select,
    reset,
    setArenaWidth,
    setFlightDurationMs,
    setStaggerMs,
  };
}
