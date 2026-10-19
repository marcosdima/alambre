import React from 'react';
import { View } from 'react-native';
import { describe, expect, it } from 'vitest';
import { render, act } from '@testing-library/react-native';
import type { PlayingCardData } from '../../src/views/card-game/types';
import {
  useCardRelaySync,
  type UseCardRelaySyncOptions,
} from '../../src/views/card-game/hooks/use-card-relay-sync';

function RelayHarness({
  options,
  hookRef,
}: {
  options: UseCardRelaySyncOptions;
  hookRef: { current: ReturnType<typeof useCardRelaySync> };
}) {
  hookRef.current = useCardRelaySync(options);
  return <View testID="relay-harness" />;
}

describe('Multiplayer Relay Synchronization Hook', () => {
  const customDeck: PlayingCardData[] = [
    { id: 'c1', suit: 'spades', rank: 'A' },
    { id: 'c2', suit: 'hearts', rank: 'K' },
    { id: 'c3', suit: 'diamonds', rank: 'Q' },
    { id: 'c4', suit: 'clubs', rank: 'J' },
  ];

  it('initializes host client with lobby state', async () => {
    const hostRef = { current: null as unknown as ReturnType<typeof useCardRelaySync> };

    await render(
      <RelayHarness
        options={{
          roomCode: 'XK99',
          playerName: 'Alice (Host)',
          isHost: true,
          mode: 'simulated',
          initialDeck: customDeck,
        }}
        hookRef={hostRef}
      />,
    );

    expect(hostRef.current.localPlayerId).toBe('alice');
    expect(hostRef.current.opponentPlayerId).toBe('bob');
    expect(hostRef.current.gameState.phase).toBe('lobby');
    expect(hostRef.current.gameState.deck).toHaveLength(4);
    expect(hostRef.current.isMyTurn).toBe(true);
  });

  it('allows host to deal round and synchronize state', async () => {
    const hostRef = { current: null as unknown as ReturnType<typeof useCardRelaySync> };

    await render(
      <RelayHarness
        options={{
          roomCode: 'XK99',
          playerName: 'Alice (Host)',
          isHost: true,
          mode: 'simulated',
          initialDeck: customDeck,
        }}
        hookRef={hostRef}
      />,
    );

    await act(async () => {
      hostRef.current.dealRound(1); // 1 card each
    });

    expect(hostRef.current.gameState.phase).toBe('playing');
    expect(hostRef.current.myHand).toHaveLength(1);
    expect(hostRef.current.opponentHand).toHaveLength(1);
    expect(hostRef.current.gameState.deck).toHaveLength(2);
  });

  it('plays card and switches active turn', async () => {
    const hostRef = { current: null as unknown as ReturnType<typeof useCardRelaySync> };

    await render(
      <RelayHarness
        options={{
          roomCode: 'XK99',
          playerName: 'Alice (Host)',
          isHost: true,
          mode: 'simulated',
          initialDeck: customDeck,
        }}
        hookRef={hostRef}
      />,
    );

    await act(async () => {
      hostRef.current.dealRound(1);
    });

    const cardToPlay = hostRef.current.myHand[0]!;

    await act(async () => {
      hostRef.current.playCard(cardToPlay.id, 'table', -5);
    });

    expect(hostRef.current.myHand).toHaveLength(0);
    expect(hostRef.current.gameState.playedPile).toHaveLength(1);
    expect(hostRef.current.gameState.playedPile[0]!.id).toBe(cardToPlay.id);
    expect(hostRef.current.gameState.playedPile[0]!.rotation).toBe(-5);
    expect(hostRef.current.gameState.currentTurn).toBe('bob');
    expect(hostRef.current.isMyTurn).toBe(false);
  });
});
