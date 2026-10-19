import type { DropZoneId, PlayerId, PlayingCardData } from '../types';
import { createStandardDeck, dealHands, drawCard as drawFromDeck, shuffleDeck } from './deck';

export interface PlayedCardEntry extends PlayingCardData {
  rotation: number;
  destination: DropZoneId;
  playedBy: PlayerId;
  timestamp: number;
}

export interface CardGameState {
  phase: 'lobby' | 'dealing' | 'playing' | 'round-over';
  deck: PlayingCardData[];
  aliceHand: PlayingCardData[];
  bobHand: PlayingCardData[];
  playedPile: PlayedCardEntry[];
  discardPile: PlayedCardEntry[];
  currentTurn: PlayerId;
  lastActionText: string;
}

/**
 * Creates a clean initial game state with a fresh shuffled deck.
 */
export function createInitialGameState(customDeck?: PlayingCardData[]): CardGameState {
  const deck = customDeck ? [...customDeck] : shuffleDeck(createStandardDeck());
  return {
    phase: 'lobby',
    deck,
    aliceHand: [],
    bobHand: [],
    playedPile: [],
    discardPile: [],
    currentTurn: 'alice',
    lastActionText: 'Match initialized. Ready to deal.',
  };
}

/**
 * Deals cards to Alice and Bob from the deck, transitioning to 'playing' phase.
 * Pure non-mutating state update.
 */
export function dealRound(
  state: CardGameState,
  cardsPerPlayer: number = 5,
): CardGameState {
  const { hands, remaining } = dealHands(state.deck, 2, cardsPerPlayer);
  const aliceHand = hands[0] ?? [];
  const bobHand = hands[1] ?? [];

  return {
    ...state,
    phase: 'playing',
    deck: remaining,
    aliceHand: aliceHand.map((c) => ({ ...c, faceUp: true })),
    bobHand: bobHand.map((c) => ({ ...c, faceUp: true })),
    currentTurn: 'alice',
    lastActionText: `Dealt ${cardsPerPlayer} cards to Alice and Bob. Alice's turn!`,
  };
}

/**
 * Plays a card from a player's hand into a target drop zone (table or discard).
 * Pure non-mutating state update.
 */
export function playCard(
  state: CardGameState,
  playerId: PlayerId,
  cardId: string,
  destination: DropZoneId = 'table',
  rotation: number = 0,
): { nextState: CardGameState; playedCard?: PlayingCardData } {
  if (state.phase !== 'playing') {
    return { nextState: state };
  }

  const isAlice = playerId === 'alice';
  const hand = isAlice ? state.aliceHand : state.bobHand;
  const card = hand.find((c) => c.id === cardId);

  if (!card) {
    return { nextState: state };
  }

  const updatedHand = hand.filter((c) => c.id !== cardId);
  const nextTurn: PlayerId = isAlice ? 'bob' : 'alice';

  const entry: PlayedCardEntry = {
    ...card,
    rotation,
    destination,
    playedBy: playerId,
    timestamp: Date.now(),
  };

  const nextPlayedPile = destination === 'table' ? [...state.playedPile, entry] : state.playedPile;
  const nextDiscardPile = destination === 'discard' ? [...state.discardPile, entry] : state.discardPile;

  const isHandEmpty = updatedHand.length === 0;
  const phase = isHandEmpty ? 'round-over' : 'playing';
  const actionText = isHandEmpty
    ? `${playerId === 'alice' ? 'Alice' : 'Bob'} played their last card! Round over.`
    : `${playerId === 'alice' ? 'Alice' : 'Bob'} played ${card.rank} of ${card.suit}. Turn: ${nextTurn}.`;

  const nextState: CardGameState = {
    ...state,
    phase,
    aliceHand: isAlice ? updatedHand : state.aliceHand,
    bobHand: isAlice ? state.bobHand : updatedHand,
    playedPile: nextPlayedPile,
    discardPile: nextDiscardPile,
    currentTurn: nextTurn,
    lastActionText: actionText,
  };

  return { nextState, playedCard: card };
}

/**
 * Draws a card from the deck into the player's hand and passes the turn.
 * Pure non-mutating state update.
 */
export function drawCard(
  state: CardGameState,
  playerId: PlayerId,
): { nextState: CardGameState; drawnCard?: PlayingCardData } {
  if (state.phase !== 'playing' || state.deck.length === 0) {
    return { nextState: state };
  }

  const { card, remaining } = drawFromDeck(state.deck);
  if (!card) {
    return { nextState: state };
  }

  const isAlice = playerId === 'alice';
  const cardFaceUp: PlayingCardData = { ...card, faceUp: true };
  const nextTurn: PlayerId = isAlice ? 'bob' : 'alice';

  const nextState: CardGameState = {
    ...state,
    deck: remaining,
    aliceHand: isAlice ? [...state.aliceHand, cardFaceUp] : state.aliceHand,
    bobHand: isAlice ? state.bobHand : [...state.bobHand, cardFaceUp],
    currentTurn: nextTurn,
    lastActionText: `${isAlice ? 'Alice' : 'Bob'} drew a card. Turn: ${nextTurn}.`,
  };

  return { nextState, drawnCard: cardFaceUp };
}

/**
 * Resets the match back to lobby phase with a reshuffled deck.
 */
export function resetMatch(
  state: CardGameState,
  customDeck?: PlayingCardData[],
): CardGameState {
  return createInitialGameState(customDeck);
}
