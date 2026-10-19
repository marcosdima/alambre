import { createSeededRng, hashSeed, shuffleWithSeed } from '@some-alambre/room-relay';
import type { PlayingCardData, Rank, Suit } from '../types';

export { createSeededRng, hashSeed, shuffleWithSeed };

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

export const RANKS: readonly Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
] as const;

export interface CreateDeckOptions {
  idPrefix?: string;
  faceUp?: boolean;
}

/**
 * Creates a standard 52-card deck.
 * Guaranteed unique IDs and standard suit/rank permutations.
 */
export function createStandardDeck(options: CreateDeckOptions = {}): PlayingCardData[] {
  const { idPrefix = 'c', faceUp = false } = options;
  const deck: PlayingCardData[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${idPrefix}_${suit}_${rank}`,
        suit,
        rank,
        faceUp,
      });
    }
  }

  return deck;
}

/**
 * Pure non-mutating Fisher-Yates shuffle algorithm.
 * Accepts an optional custom RNG function or a deterministic seed (string | number).
 */
export function shuffleDeck<T>(
  deck: readonly T[],
  rngOrSeed: (() => number) | string | number = Math.random,
): T[] {
  if (typeof rngOrSeed === 'string' || typeof rngOrSeed === 'number') {
    return shuffleWithSeed(deck, rngOrSeed);
  }
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rngOrSeed() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

/**
 * Deals `count` cards from the top of the deck.
 */
export function dealCards(
  deck: readonly PlayingCardData[],
  count: number,
): { dealt: PlayingCardData[]; remaining: PlayingCardData[] } {
  const safeCount = Math.max(0, Math.min(count, deck.length));
  const dealt = deck.slice(0, safeCount);
  const remaining = deck.slice(safeCount);
  return { dealt, remaining };
}

/**
 * Draws a single card from the top of the deck.
 */
export function drawCard(
  deck: readonly PlayingCardData[],
): { card?: PlayingCardData; remaining: PlayingCardData[] } {
  if (deck.length === 0) {
    return { card: undefined, remaining: [] };
  }
  const [card, ...remaining] = deck;
  return { card, remaining };
}

/**
 * Deals cards to multiple players in round-robin fashion, returning an array of hands.
 */
export function dealHands(
  deck: readonly PlayingCardData[],
  playerCount: number,
  cardsPerPlayer: number,
): { hands: PlayingCardData[][]; remaining: PlayingCardData[] } {
  if (playerCount <= 0 || cardsPerPlayer <= 0) {
    return { hands: [], remaining: [...deck] };
  }

  const hands: PlayingCardData[][] = Array.from({ length: playerCount }, () => []);
  let cursor = 0;

  for (let r = 0; r < cardsPerPlayer; r++) {
    for (let p = 0; p < playerCount; p++) {
      if (cursor < deck.length) {
        hands[p].push(deck[cursor]!);
        cursor++;
      }
    }
  }

  return {
    hands,
    remaining: deck.slice(cursor),
  };
}
