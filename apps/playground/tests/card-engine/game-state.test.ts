import { describe, expect, it } from 'vitest';
import type { PlayingCardData } from '../../src/views/card-game/types';
import {
  createInitialGameState,
  dealRound,
  drawCard,
  playCard,
  resetMatch,
} from '../../src/views/card-game/engine/game-state';

describe('Game State Engine', () => {
  const customDeck: PlayingCardData[] = [
    { id: 'c1', suit: 'spades', rank: 'A' },
    { id: 'c2', suit: 'hearts', rank: 'K' },
    { id: 'c3', suit: 'diamonds', rank: 'Q' },
    { id: 'c4', suit: 'clubs', rank: 'J' },
    { id: 'c5', suit: 'spades', rank: '10' },
    { id: 'c6', suit: 'hearts', rank: '9' },
  ];

  it('creates initial game state in lobby phase', () => {
    const state = createInitialGameState(customDeck);

    expect(state.phase).toBe('lobby');
    expect(state.deck).toHaveLength(6);
    expect(state.aliceHand).toHaveLength(0);
    expect(state.bobHand).toHaveLength(0);
    expect(state.playedPile).toHaveLength(0);
    expect(state.currentTurn).toBe('alice');
  });

  it('deals round, populating hands and transitioning to playing phase', () => {
    const initial = createInitialGameState(customDeck);
    const state = dealRound(initial, 2);

    expect(state.phase).toBe('playing');
    expect(state.aliceHand).toHaveLength(2);
    expect(state.bobHand).toHaveLength(2);
    expect(state.deck).toHaveLength(2);
    expect(state.currentTurn).toBe('alice');
  });

  it('plays card to table pile, removing it from player hand and passing turn', () => {
    const initial = createInitialGameState(customDeck);
    const active = dealRound(initial, 2);
    const cardToPlay = active.aliceHand[0]!;

    const { nextState, playedCard } = playCard(active, 'alice', cardToPlay.id, 'table', -4);

    expect(playedCard?.id).toBe(cardToPlay.id);
    expect(nextState.aliceHand).toHaveLength(1);
    expect(nextState.playedPile).toHaveLength(1);
    expect(nextState.playedPile[0]!.id).toBe(cardToPlay.id);
    expect(nextState.playedPile[0]!.rotation).toBe(-4);
    expect(nextState.currentTurn).toBe('bob');
  });

  it('detects round-over when player plays their last card', () => {
    const initial = createInitialGameState(customDeck);
    const active = dealRound(initial, 1); // 1 card each
    const cardToPlay = active.aliceHand[0]!;

    const { nextState } = playCard(active, 'alice', cardToPlay.id, 'table', 0);

    expect(nextState.aliceHand).toHaveLength(0);
    expect(nextState.phase).toBe('round-over');
  });

  it('draws card from deck, adding to player hand and passing turn', () => {
    const initial = createInitialGameState(customDeck);
    const active = dealRound(initial, 2); // 2 cards left in deck
    expect(active.deck).toHaveLength(2);

    const { nextState, drawnCard } = drawCard(active, 'alice');

    expect(drawnCard).toBeDefined();
    expect(nextState.aliceHand).toHaveLength(3);
    expect(nextState.deck).toHaveLength(1);
    expect(nextState.currentTurn).toBe('bob');
  });

  it('resets match cleanly', () => {
    const initial = createInitialGameState(customDeck);
    const active = dealRound(initial, 2);
    const reset = resetMatch(active, customDeck);

    expect(reset.phase).toBe('lobby');
    expect(reset.deck).toHaveLength(6);
    expect(reset.aliceHand).toHaveLength(0);
  });
});
