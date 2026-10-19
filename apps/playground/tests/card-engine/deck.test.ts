import { describe, expect, it } from 'vitest';
import {
  createStandardDeck,
  dealCards,
  dealHands,
  drawCard,
  RANKS,
  shuffleDeck,
  SUITS,
} from '../../src/views/card-game/engine/deck';

describe('Deck Engine', () => {
  describe('createStandardDeck', () => {
    it('creates a standard 52-card deck', () => {
      const deck = createStandardDeck();
      expect(deck).toHaveLength(52);
    });

    it('contains all 4 suits and 13 ranks without duplicates', () => {
      const deck = createStandardDeck();
      const uniqueIds = new Set(deck.map((c) => c.id));
      expect(uniqueIds.size).toBe(52);

      for (const suit of SUITS) {
        const suitCards = deck.filter((c) => c.suit === suit);
        expect(suitCards).toHaveLength(13);
        for (const rank of RANKS) {
          expect(suitCards.some((c) => c.rank === rank)).toBe(true);
        }
      }
    });

    it('respects custom prefix and initial faceUp flag', () => {
      const deck = createStandardDeck({ idPrefix: 'custom', faceUp: true });
      expect(deck[0]!.id.startsWith('custom_')).toBe(true);
      expect(deck.every((c) => c.faceUp === true)).toBe(true);
    });
  });

  describe('shuffleDeck', () => {
    it('preserves array length and elements during shuffle', () => {
      const deck = createStandardDeck();
      const shuffled = shuffleDeck(deck);

      expect(shuffled).toHaveLength(52);
      expect(new Set(shuffled.map((c) => c.id)).size).toBe(52);
    });

    it('does not mutate the original deck array', () => {
      const original = createStandardDeck();
      const copy = [...original];
      shuffleDeck(original);

      expect(original).toEqual(copy);
    });

    it('produces deterministic permutations with custom RNG', () => {
      const deck = createStandardDeck();
      // Simple pseudo-RNG for test determinism
      let seed = 42;
      const deterministicRng = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      const shuffled1 = shuffleDeck(deck, deterministicRng);
      seed = 42;
      const shuffled2 = shuffleDeck(deck, deterministicRng);

      expect(shuffled1.map((c) => c.id)).toEqual(shuffled2.map((c) => c.id));
    });
  });

  describe('dealCards', () => {
    it('deals specified number of cards from top of deck', () => {
      const deck = createStandardDeck();
      const { dealt, remaining } = dealCards(deck, 5);

      expect(dealt).toHaveLength(5);
      expect(remaining).toHaveLength(47);
      expect(dealt[0]!.id).toBe(deck[0]!.id);
      expect(dealt[4]!.id).toBe(deck[4]!.id);
      expect(remaining[0]!.id).toBe(deck[5]!.id);
    });

    it('handles requests larger than deck size safely', () => {
      const deck = createStandardDeck().slice(0, 3);
      const { dealt, remaining } = dealCards(deck, 10);

      expect(dealt).toHaveLength(3);
      expect(remaining).toHaveLength(0);
    });
  });

  describe('drawCard', () => {
    it('draws single top card and returns remaining deck', () => {
      const deck = createStandardDeck();
      const { card, remaining } = drawCard(deck);

      expect(card).toBeDefined();
      expect(card!.id).toBe(deck[0]!.id);
      expect(remaining).toHaveLength(51);
    });

    it('returns undefined card when drawing from empty deck', () => {
      const { card, remaining } = drawCard([]);
      expect(card).toBeUndefined();
      expect(remaining).toHaveLength(0);
    });
  });

  describe('dealHands', () => {
    it('deals cards round-robin to specified number of players', () => {
      const deck = createStandardDeck();
      const { hands, remaining } = dealHands(deck, 2, 5);

      expect(hands).toHaveLength(2);
      expect(hands[0]).toHaveLength(5);
      expect(hands[1]).toHaveLength(5);
      expect(remaining).toHaveLength(42);

      // Round robin check: player 0 gets index 0, player 1 gets index 1, player 0 gets index 2...
      expect(hands[0]![0]!.id).toBe(deck[0]!.id);
      expect(hands[1]![0]!.id).toBe(deck[1]!.id);
      expect(hands[0]![1]!.id).toBe(deck[2]!.id);
    });
  });
});
