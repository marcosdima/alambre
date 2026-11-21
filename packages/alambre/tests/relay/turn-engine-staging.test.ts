import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createSimulatedRelayHub } from '../../src/relay/transports/simulated';
import { useTurnEngine } from '../../src/relay/react/use-turn-engine';
import type { TurnReducer } from '../../src/relay/turn-engine';

interface GameState {
  stockCount: number;
  discard: string[];
  playerHand: string[];
}

type GameAction =
  | { type: 'DRAW_DISCARD' }
  | { type: 'DRAW_STOCK'; card: string };

const gameReducer: TurnReducer<GameState, GameAction> = (state, action) => {
  switch (action.type) {
    case 'DRAW_DISCARD': {
      const topCard = state.discard[state.discard.length - 1];
      return {
        ...state,
        discard: state.discard.slice(0, -1),
        playerHand: [...state.playerHand, topCard],
      };
    }
    case 'DRAW_STOCK': {
      return {
        ...state,
        stockCount: Math.max(0, state.stockCount - 1),
        playerHand: [...state.playerHand, action.card],
      };
    }
    default:
      return state;
  }
};

describe('useTurnEngine optimistic in-flight staging', () => {
  const initialGameState: GameState = {
    stockCount: 40,
    discard: ['card-A', 'card-B', 'card-C'],
    playerHand: ['card-1', 'card-2'],
  };

  it('stages an optimistic patch immediately on visualGameState during flight', () => {
    const hub = createSimulatedRelayHub();
    const { result } = renderHook(() =>
      useTurnEngine<GameState, GameAction>({
        initialState: initialGameState,
        reducer: gameReducer,
        roomCode: 'TEST01',
        playerId: 'p1',
        playerName: 'Player1',
        isHost: true,
        simulatedHub: hub,
        autoConnect: true,
      }),
    );

    expect(result.current.gameState.discard).toEqual(['card-A', 'card-B', 'card-C']);
    expect(result.current.visualGameState.discard).toEqual(['card-A', 'card-B', 'card-C']);

    // Stage flight: drawing card-C from discard pile
    act(() => {
      result.current.stageFlight('flight-draw-1', (state) => ({
        ...state,
        discard: state.discard.slice(0, -1),
      }));
    });

    // Authoritative gameState is unchanged (still has card-C)
    expect(result.current.gameState.discard).toHaveLength(3);
    // visualGameState immediately reflects the departure (only card-A, card-B)
    expect(result.current.visualGameState.discard).toEqual(['card-A', 'card-B']);

    // Commit flight when card lands: commits authoritative action and evicts staged patch
    act(() => {
      result.current.commitFlight('flight-draw-1', { type: 'DRAW_DISCARD' });
    });

    // Now both gameState and visualGameState have the committed change
    expect(result.current.gameState.discard).toEqual(['card-A', 'card-B']);
    expect(result.current.visualGameState.discard).toEqual(['card-A', 'card-B']);
    expect(result.current.gameState.playerHand).toEqual(['card-1', 'card-2', 'card-C']);
    expect(result.current.stagedFlights).toHaveLength(0);
  });

  it('cancels staged flight without dispatching action', () => {
    const hub = createSimulatedRelayHub();
    const { result } = renderHook(() =>
      useTurnEngine<GameState, GameAction>({
        initialState: initialGameState,
        reducer: gameReducer,
        roomCode: 'TEST02',
        playerId: 'p1',
        playerName: 'Player1',
        isHost: true,
        simulatedHub: hub,
        autoConnect: true,
      }),
    );

    act(() => {
      result.current.stageFlight('flight-draw-2', (state) => ({
        ...state,
        stockCount: state.stockCount - 1,
      }));
    });

    expect(result.current.visualGameState.stockCount).toBe(39);
    expect(result.current.gameState.stockCount).toBe(40);

    // Cancel flight (e.g. gesture aborted)
    act(() => {
      result.current.cancelFlight('flight-draw-2');
    });

    expect(result.current.visualGameState.stockCount).toBe(40);
    expect(result.current.gameState.stockCount).toBe(40);
    expect(result.current.stagedFlights).toHaveLength(0);
  });
});
