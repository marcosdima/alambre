import { useCallback, useEffect, useRef } from 'react';
import { useRoomRelay, useTurnEngine } from '@some-alambre/room-relay';
import type { CardGameRelayEvents, DropZoneId, PlayerId, PlayingCardData } from '../types';
import {
  createInitialGameState,
  dealRound as engineDealRound,
  drawCard as engineDrawCard,
  playCard as enginePlayCard,
  resetMatch as engineResetMatch,
  type CardGameState,
} from '../engine/game-state';

export interface OpponentFlightEvent {
  card: PlayingCardData;
  targetRotation: number;
  destination: DropZoneId;
}

export type CardTurnAction =
  | { type: 'DEAL'; cardsPerPlayer: number }
  | {
      type: 'PLAY';
      playerId: PlayerId;
      cardId: string;
      destination: DropZoneId;
      targetRotation: number;
    }
  | { type: 'DRAW'; playerId: PlayerId }
  | { type: 'RESET'; customDeck?: PlayingCardData[] }
  | { type: 'SYNC_STATE'; state: CardGameState };

export interface UseCardRelaySyncOptions {
  roomCode: string;
  playerName: string;
  isHost: boolean;
  mode?: 'simulated' | 'websocket';
  serverUrl?: string;
  initialDeck?: PlayingCardData[];
  onOpponentPlay?: (flight: OpponentFlightEvent) => void;
}

function cardGameTurnReducer(state: CardGameState, action: CardTurnAction): CardGameState {
  switch (action.type) {
    case 'DEAL':
      return engineDealRound(state, action.cardsPerPlayer);
    case 'PLAY':
      return enginePlayCard(
        state,
        action.playerId,
        action.cardId,
        action.destination,
        action.targetRotation,
      ).nextState;
    case 'DRAW':
      return engineDrawCard(state, action.playerId).nextState;
    case 'RESET':
      return engineResetMatch(state, action.customDeck);
    case 'SYNC_STATE':
      return action.state;
  }
}

export function useCardRelaySync(options: UseCardRelaySyncOptions) {
  const {
    roomCode,
    playerName,
    isHost,
    mode = 'simulated',
    serverUrl,
    initialDeck,
    onOpponentPlay,
  } = options;

  const localPlayerId: PlayerId = isHost ? 'alice' : 'bob';
  const opponentPlayerId: PlayerId = isHost ? 'bob' : 'alice';

  const onOpponentPlayRef = useRef(onOpponentPlay);
  onOpponentPlayRef.current = onOpponentPlay;

  const relay = useRoomRelay<CardGameRelayEvents>({
    roomCode,
    playerName,
    isHost,
    mode,
    serverUrl,
  });

  const turnEngine = useTurnEngine<CardGameState, CardTurnAction, CardGameRelayEvents>({
    client: relay.client,
    initialState: createInitialGameState(initialDeck),
    reducer: cardGameTurnReducer,
    onActionCommitted: (action, nextState) => {
      if (action.type === 'PLAY' && action.playerId === opponentPlayerId) {
        const lastPlayed =
          action.destination === 'discard'
            ? nextState.discardPile[nextState.discardPile.length - 1]
            : nextState.playedPile[nextState.playedPile.length - 1];
        if (lastPlayed) {
          onOpponentPlayRef.current?.({
            card: lastPlayed,
            targetRotation: action.targetRotation,
            destination: action.destination,
          });
        }
      }
    },
  });

  const { gameState } = turnEngine;

  // Preserve compatibility with direct legacy event listeners
  useEffect(() => {
    const unsubDeal = relay.on('GAME_DEAL', (payload) => {
      if (isHost) return;
      turnEngine.dispatch({
        type: 'SYNC_STATE',
        state: {
          ...turnEngine.engine.getState().gameState,
          phase: 'playing',
          aliceHand: payload.aliceHand,
          bobHand: payload.bobHand,
          deck: payload.deckRemaining,
          currentTurn: payload.turn,
          lastActionText: `Round dealt. ${payload.turn === 'alice' ? 'Alice' : 'Bob'}'s turn!`,
        },
      });
    });

    const unsubPlay = relay.on('CARD_PLAY', (payload) => {
      if (payload.playerId === opponentPlayerId && isHost) {
        turnEngine.dispatch({
          type: 'PLAY',
          playerId: payload.playerId,
          cardId: payload.card.id,
          destination: payload.destination,
          targetRotation: payload.targetRotation,
        });
      }
    });

    const unsubDraw = relay.on('CARD_DRAW', (payload) => {
      if (payload.playerId === opponentPlayerId && isHost) {
        turnEngine.dispatch({
          type: 'DRAW',
          playerId: payload.playerId,
        });
      }
    });

    const unsubReset = relay.on('GAME_RESET', (payload) => {
      if (isHost) {
        turnEngine.resetGameState(createInitialGameState(payload.deck), true);
      }
    });

    return () => {
      unsubDeal();
      unsubPlay();
      unsubDraw();
      unsubReset();
    };
  }, [relay, isHost, opponentPlayerId, turnEngine]);

  const dealRound = useCallback(
    (cardsPerPlayer: number = 5) => {
      if (!isHost) return;
      turnEngine.dispatch({ type: 'DEAL', cardsPerPlayer });
      const next = turnEngine.engine.getState().gameState;
      relay.send('GAME_DEAL', {
        aliceHand: next.aliceHand,
        bobHand: next.bobHand,
        deckRemaining: next.deck,
        turn: next.currentTurn,
      });
    },
    [isHost, turnEngine, relay],
  );

  const playCard = useCallback(
    (cardId: string, destination: DropZoneId = 'table', rotation: number = 0) => {
      const current = turnEngine.engine.getState().gameState;
      const { nextState, playedCard } = enginePlayCard(
        current,
        localPlayerId,
        cardId,
        destination,
        rotation,
      );

      if (playedCard) {
        turnEngine.dispatch({
          type: 'PLAY',
          playerId: localPlayerId,
          cardId,
          destination,
          targetRotation: rotation,
        });

        relay.send('CARD_PLAY', {
          playerId: localPlayerId,
          card: playedCard,
          targetRotation: rotation,
          destination,
          nextTurn: nextState.currentTurn,
        });
      }
    },
    [localPlayerId, turnEngine, relay],
  );

  const drawCard = useCallback(() => {
    const current = turnEngine.engine.getState().gameState;
    const { nextState, drawnCard } = engineDrawCard(current, localPlayerId);

    if (drawnCard) {
      turnEngine.dispatch({
        type: 'DRAW',
        playerId: localPlayerId,
      });

      relay.send('CARD_DRAW', {
        playerId: localPlayerId,
        card: drawnCard,
        nextTurn: nextState.currentTurn,
      });
    }
  }, [localPlayerId, turnEngine, relay]);

  const resetGame = useCallback(
    (customDeck?: PlayingCardData[]) => {
      turnEngine.dispatch({ type: 'RESET', customDeck });
      const fresh = turnEngine.engine.getState().gameState;
      relay.send('GAME_RESET', {
        deck: fresh.deck,
      });
    },
    [turnEngine, relay],
  );

  const isMyTurn = gameState.currentTurn === localPlayerId;
  const myHand = isHost ? gameState.aliceHand : gameState.bobHand;
  const opponentHand = isHost ? gameState.bobHand : gameState.aliceHand;

  return {
    gameState,
    seq: turnEngine.seq,
    myHand,
    opponentHand,
    localPlayerId,
    opponentPlayerId,
    isMyTurn,
    dealRound,
    playCard,
    drawCard,
    resetGame,
    relayStatus: relay.status,
    peers: relay.peers,
    latency: relay.latency,
    roomCode: relay.roomCode,
    relay,
    turnEngine,
  };
}

