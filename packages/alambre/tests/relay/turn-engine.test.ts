import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  createTurnEngine,
  type TurnReducer,
} from '../../src/relay/turn-engine';
import { createSimulatedRelayHub } from '../../src/relay/transports/simulated';
import { useTurnEngine } from '../../src/relay/react/use-turn-engine';

interface TestGameState {
  count: number;
  lastAction: string;
  deck?: string[];
  hands?: Record<string, string[]>;
}

type TestAction =
  | { type: 'INCREMENT'; by?: number }
  | { type: 'DECREMENT'; by?: number }
  | { type: 'SET'; value: number }
  | { type: 'TIMEOUT_AUTO_PASS' }
  | { type: 'PLAY_CARD'; card: string }
  | { type: 'ILLEGAL_MOVE'; value: number };

const testReducer: TurnReducer<TestGameState, TestAction> = (
  state,
  action,
  meta,
) => {
  switch (action.type) {
    case 'INCREMENT':
      return {
        ...state,
        count: state.count + (action.by ?? 1),
        lastAction: `INCREMENT:${meta.senderId}`,
      };
    case 'DECREMENT':
      return {
        ...state,
        count: state.count - (action.by ?? 1),
        lastAction: `DECREMENT:${meta.senderId}`,
      };
    case 'SET':
      return {
        ...state,
        count: action.value,
        lastAction: `SET:${meta.senderId}`,
      };
    case 'TIMEOUT_AUTO_PASS':
      return {
        ...state,
        count: state.count + 100,
        lastAction: `TIMEOUT:${meta.senderId}`,
      };
    case 'PLAY_CARD': {
      const playerHand = state.hands?.[meta.senderId] ?? [];
      return {
        ...state,
        hands: {
          ...state.hands,
          [meta.senderId]: playerHand.filter((c) => c !== action.card),
        },
        lastAction: `PLAY:${action.card}`,
      };
    }
    case 'ILLEGAL_MOVE':
      return {
        ...state,
        count: state.count + action.value,
        lastAction: 'ILLEGAL',
      };
    default:
      return state;
  }
};

describe('TurnEngine (RFC-0020 Authoritative Multiplayer & State Sync)', () => {
  let hub: ReturnType<typeof createSimulatedRelayHub>;

  beforeEach(() => {
    hub = createSimulatedRelayHub();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  const advanceNetwork = (ms = 50) => {
    vi.advanceTimersByTime(ms);
  };

  describe('1. Basic Turn Engine Lifecycle, Commits, SyncSnapshot & Timers', () => {
    it('initializes with default TurnEngineState', () => {
      const engine = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'BASE1',
        playerName: 'Alice',
        isHost: true,
        simulatedHub: hub,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      const state = engine.getState();
      expect(state.gameState).toEqual({ count: 0, lastAction: 'INIT' });
      expect(state.seq).toBe(0);
      expect(state.lastAction).toBeNull();
      expect(state.lastSenderId).toBeNull();
      expect(state.turnDeadline).toBeNull();
      expect(state.remainingTurnMs).toBeNull();
      expect(state.isOptimistic).toBe(false);
      expect(state.pendingActionsCount).toBe(0);

      engine.destroy();
    });

    it('host commits actions synchronously, updating seq and gameState', () => {
      const onActionCommitted = vi.fn();
      const engine = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'BASE2',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
        onActionCommitted,
      });

      advanceNetwork(30);

      const dispatched = engine.dispatch({ type: 'INCREMENT', by: 5 });
      expect(dispatched).toBe(true);

      const state = engine.getState();
      expect(state.seq).toBe(1);
      expect(state.gameState.count).toBe(5);
      expect(state.gameState.lastAction).toBe('INCREMENT:host_p1');
      expect(state.lastSenderId).toBe('host_p1');
      expect(state.lastAction).toEqual({ type: 'INCREMENT', by: 5 });

      expect(onActionCommitted).toHaveBeenCalledTimes(1);
      expect(onActionCommitted).toHaveBeenCalledWith(
        { type: 'INCREMENT', by: 5 },
        { count: 5, lastAction: 'INCREMENT:host_p1' },
        expect.objectContaining({
          seq: 1,
          senderId: 'host_p1',
          timestamp: expect.any(Number),
        }),
      );

      engine.destroy();
    });

    it('routes guest action intent to host, host commits and broadcasts to guest', () => {
      const hostCommitted = vi.fn();
      const guestCommitted = vi.fn();

      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'GAME1',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 10, lastAction: 'INIT' },
        reducer: testReducer,
        onActionCommitted: hostCommitted,
      });

      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'GAME1',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 10, lastAction: 'INIT' },
        reducer: testReducer,
        onActionCommitted: guestCommitted,
      });

      advanceNetwork(50);

      // Guest dispatches an action without optimistic mode
      const result = guest.dispatch({ type: 'INCREMENT', by: 4 });
      expect(result).toBe(true);

      // Non-optimistic guest does not mutate state yet
      expect(guest.getState().gameState.count).toBe(10);
      expect(guest.getState().seq).toBe(0);

      // Advance network for intent -> host commit -> guest commit receipt
      advanceNetwork(80);

      expect(host.getState().seq).toBe(1);
      expect(host.getState().gameState.count).toBe(14);
      expect(hostCommitted).toHaveBeenCalledTimes(1);

      expect(guest.getState().seq).toBe(1);
      expect(guest.getState().gameState.count).toBe(14);
      expect(guest.getState().gameState.lastAction).toBe('INCREMENT:guest_p2');
      expect(guestCommitted).toHaveBeenCalledTimes(1);

      host.destroy();
      guest.destroy();
    });

    it('respects host validateAction guard on guest intent', () => {
      const hostRejected = vi.fn();
      const guestRejected = vi.fn();

      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'GUARD1',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
        validateAction: (_state, action, senderId) => {
          if (action.type === 'ILLEGAL_MOVE') return false;
          if (senderId !== 'host_p1' && action.type === 'SET') return false;
          return true;
        },
        onActionRejected: hostRejected,
      });

      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'GUARD1',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
        onActionRejected: guestRejected,
      });

      advanceNetwork(50);

      // Guest sends forbidden action (SET)
      guest.dispatch({ type: 'SET', value: 99 });
      advanceNetwork(80);

      expect(host.getState().seq).toBe(0);
      expect(host.getState().gameState.count).toBe(0);
      expect(hostRejected).toHaveBeenCalledTimes(1);
      expect(hostRejected).toHaveBeenCalledWith(
        { type: 'SET', value: 99 },
        'guest_p2',
        { count: 0, lastAction: 'INIT' },
      );

      expect(guest.getState().seq).toBe(0);
      expect(guest.getState().gameState.count).toBe(0);
      expect(guestRejected).toHaveBeenCalledTimes(1);

      host.destroy();
      guest.destroy();
    });

    it('host resetGameState forces state replacement and syncs snapshot (with resetSeq true and false)', () => {
      const onSnapshotSynced = vi.fn();

      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'RESET1',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'RESET1',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
        onSnapshotSynced,
      });

      advanceNetwork(50);

      // Commit 2 actions
      host.dispatch({ type: 'INCREMENT', by: 1 });
      host.dispatch({ type: 'INCREMENT', by: 1 });
      advanceNetwork(50);
      expect(host.getState().seq).toBe(2);

      // Reset state with resetSeq = false (increments seq to 3)
      host.resetGameState({ count: 50, lastAction: 'RESET_CONTINUE' }, false);
      expect(host.getState().seq).toBe(3);
      expect(host.getState().gameState.count).toBe(50);

      advanceNetwork(50);
      expect(guest.getState().seq).toBe(3);
      expect(guest.getState().gameState.count).toBe(50);
      expect(onSnapshotSynced).toHaveBeenCalledWith(
        { count: 50, lastAction: 'RESET_CONTINUE' },
        3,
      );

      // Reset state with resetSeq = true on host
      host.resetGameState({ count: 0, lastAction: 'RESET_ZERO' }, true);
      expect(host.getState().seq).toBe(0);
      expect(host.getState().gameState.count).toBe(0);

      host.destroy();
      guest.destroy();
    });

    it('syncs resetGameState with resetSeq = true when sequence is at zero', () => {
      const onSnapshotSynced = vi.fn();
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'RESET_ZERO_ROOM',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'RESET_ZERO_ROOM',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
        onSnapshotSynced,
      });

      advanceNetwork(50);

      // Host resets state at seq 0 with resetSeq = true
      host.resetGameState({ count: 77, lastAction: 'INITIAL_OVERRIDE' }, true);
      expect(host.getState().seq).toBe(0);
      expect(host.getState().gameState.count).toBe(77);

      advanceNetwork(50);
      expect(guest.getState().seq).toBe(0);
      expect(guest.getState().gameState.count).toBe(77);
      expect(onSnapshotSynced).toHaveBeenCalledWith(
        { count: 77, lastAction: 'INITIAL_OVERRIDE' },
        0,
      );

      host.destroy();
      guest.destroy();
    });

    it('handles guest requestSync and non-host calling host-only methods', () => {
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'SYNC1',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 42, lastAction: 'AUTH' },
        reducer: testReducer,
      });

      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'SYNC1',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      // Guest connects -> auto-requests sync snapshot
      advanceNetwork(60);
      expect(guest.getState().gameState.count).toBe(42);

      // Non-host calling resetGameState or syncSnapshot is a no-op
      guest.resetGameState({ count: 999, lastAction: 'ILLEGAL' });
      guest.syncSnapshot();
      advanceNetwork(50);

      expect(host.getState().gameState.count).toBe(42);
      expect(guest.getState().gameState.count).toBe(42);

      // Manual requestSync
      host.dispatch({ type: 'INCREMENT', by: 8 });
      guest.requestSync();
      advanceNetwork(60);
      expect(guest.getState().gameState.count).toBe(50);

      host.destroy();
      guest.destroy();
    });

    it('runs countdown timer and updates remainingTurnMs on each timerTickMs', () => {
      const listener = vi.fn();
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'TIMER1',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        turnDurationMs: 3000,
        timerTickMs: 500,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      host.subscribe(listener);
      host.startTurnTimer(3000);

      const state0 = host.getState();
      expect(state0.turnDeadline).toBeGreaterThan(0);
      expect(state0.remainingTurnMs).toBe(3000);

      // Advance by 500ms
      vi.advanceTimersByTime(500);
      expect(host.getState().remainingTurnMs).toBe(2500);
      expect(listener).toHaveBeenCalled();

      // Advance by 1000ms
      vi.advanceTimersByTime(1000);
      expect(host.getState().remainingTurnMs).toBe(1500);

      // Action commit resets the turn timer automatically
      host.dispatch({ type: 'INCREMENT', by: 1 });
      expect(host.getState().remainingTurnMs).toBe(3000);

      // Stop turn timer clears deadline and remainingTurnMs
      host.stopTurnTimer();
      expect(host.getState().turnDeadline).toBeNull();
      expect(host.getState().remainingTurnMs).toBeNull();

      host.destroy();
    });

    it('triggers onTurnTimeout on expiration and dispatches timeout action automatically', () => {
      const timeoutSpy = vi.fn((_state, _seq) => ({ type: 'TIMEOUT_AUTO_PASS' } as TestAction));

      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'TIMER2',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        turnDurationMs: 2000,
        timerTickMs: 250,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
        onTurnTimeout: timeoutSpy,
      });

      advanceNetwork(30);
      host.startTurnTimer(2000);

      // Advance time past expiration (2000ms + tick)
      vi.advanceTimersByTime(2100);

      expect(timeoutSpy).toHaveBeenCalledTimes(1);
      expect(timeoutSpy).toHaveBeenCalledWith({ count: 0, lastAction: 'INIT' }, 0);

      // Action TIMEOUT_AUTO_PASS was automatically committed (+100 count)
      expect(host.getState().gameState.count).toBe(100);
      expect(host.getState().seq).toBe(1);

      host.destroy();
    });

    it('cleans up resources and closes relay client on destroy', () => {
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'DEST1',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        turnDurationMs: 2000,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      advanceNetwork(30);
      host.startTurnTimer();

      host.destroy();

      // Dispatch after destroy returns false
      const result = host.dispatch({ type: 'INCREMENT', by: 1 });
      expect(result).toBe(false);
      expect(host.relay.isDestroyed()).toBe(true);

      // Timers should be canceled without throwing
      vi.advanceTimersByTime(3000);
      expect(host.getState().gameState.count).toBe(0);
    });
  });

  describe('2. Fog-of-War (projectStateForPeer)', () => {
    it('host commits action and projects censored state to guest peer while preserving full authoritative state', () => {
      const initialDeck = ['Card_A', 'Card_B', 'Card_C'];
      const initialHands = {
        host_p1: ['Host_Secret1', 'Host_Secret2'],
        guest_p2: ['Guest_Card1', 'Guest_Card2'],
      };

      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'FOG1',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: {
          count: 0,
          lastAction: 'INIT',
          deck: initialDeck,
          hands: initialHands,
        },
        reducer: testReducer,
        projectStateForPeer: (fullState, peerId) => {
          // Fog of war projection: redact deck cards and other players' private hands
          const censoredHands: Record<string, string[]> = {};
          if (fullState.hands) {
            for (const [pid, cards] of Object.entries(fullState.hands)) {
              censoredHands[pid] = pid === peerId ? cards : cards.map(() => 'REDACTED');
            }
          }
          return {
            ...fullState,
            deck: fullState.deck ? fullState.deck.map(() => 'UNKNOWN') : [],
            hands: censoredHands,
          };
        },
      });

      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'FOG1',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      advanceNetwork(60);

      // Host plays a card
      host.dispatch({ type: 'PLAY_CARD', card: 'Host_Secret1' });
      advanceNetwork(60);

      // 1. Host authoritative state preserves actual card names
      const hostState = host.getState().gameState;
      expect(hostState.hands?.host_p1).toEqual(['Host_Secret2']);
      expect(hostState.hands?.guest_p2).toEqual(['Guest_Card1', 'Guest_Card2']);
      expect(hostState.deck).toEqual(['Card_A', 'Card_B', 'Card_C']);

      // 2. Guest receives projected / censored state via point-to-point routing
      const guestState = guest.getState().gameState;
      expect(guestState.hands?.guest_p2).toEqual(['Guest_Card1', 'Guest_Card2']); // guest sees own hand
      expect(guestState.hands?.host_p1).toEqual(['REDACTED']); // host hand censored
      expect(guestState.deck).toEqual(['UNKNOWN', 'UNKNOWN', 'UNKNOWN']); // deck censored

      host.destroy();
      guest.destroy();
    });

    it('routes distinct projections to multiple peers via point-to-point routing (no leakage)', () => {
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'FOG2',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: {
          count: 0,
          lastAction: 'INIT',
          hands: {
            host_p1: ['H_1'],
            guest_a: ['A_Secret_1', 'A_Secret_2'],
            guest_b: ['B_Secret_1', 'B_Secret_2'],
          },
        },
        reducer: testReducer,
        projectStateForPeer: (fullState, peerId) => {
          const hands: Record<string, string[]> = {};
          for (const [pid, cards] of Object.entries(fullState.hands ?? {})) {
            hands[pid] = pid === peerId ? cards : cards.map(() => 'CENSORED');
          }
          return { ...fullState, hands };
        },
      });

      advanceNetwork(30);

      const guestA = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'FOG2',
        playerId: 'guest_a',
        playerName: 'Alice',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      const guestB = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'FOG2',
        playerId: 'guest_b',
        playerName: 'Bob',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      advanceNetwork(60);

      // Host triggers snapshot sync with projections
      host.syncSnapshot();
      advanceNetwork(60);

      // Alice only sees Alice's secrets
      const aHands = guestA.getState().gameState.hands!;
      expect(aHands.guest_a).toEqual(['A_Secret_1', 'A_Secret_2']);
      expect(aHands.guest_b).toEqual(['CENSORED', 'CENSORED']);
      expect(aHands.host_p1).toEqual(['CENSORED']);

      // Bob only sees Bob's secrets
      const bHands = guestB.getState().gameState.hands!;
      expect(bHands.guest_b).toEqual(['B_Secret_1', 'B_Secret_2']);
      expect(bHands.guest_a).toEqual(['CENSORED', 'CENSORED']);
      expect(bHands.host_p1).toEqual(['CENSORED']);

      // Host retains full unredacted state
      const hostHands = host.getState().gameState.hands!;
      expect(hostHands.guest_a).toEqual(['A_Secret_1', 'A_Secret_2']);
      expect(hostHands.guest_b).toEqual(['B_Secret_1', 'B_Secret_2']);
      expect(hostHands.host_p1).toEqual(['H_1']);

      host.destroy();
      guestA.destroy();
      guestB.destroy();
    });
  });

  describe('3. Optimistic Actions & Rollback', () => {
    it('mutates local gameState synchronously with isOptimistic: true at 0ms latency', () => {
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'OPT1',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 25,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      advanceNetwork(35);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'OPT1',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 25,
        simulatedHub: hub,
        autoConnect: true,
        optimistic: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      advanceNetwork(50);

      // Dispatch optimistic action from guest
      guest.dispatch({ type: 'INCREMENT', by: 7 });

      // Synchronous immediate assertion (0ms elapsed, ahead of network)
      const guestState = guest.getState();
      expect(guestState.gameState.count).toBe(7);
      expect(guestState.isOptimistic).toBe(true);
      expect(guestState.pendingActionsCount).toBe(1);
      expect(guestState.seq).toBe(0); // Authoritative sequence not advanced yet

      // Host has not received it yet
      expect(host.getState().gameState.count).toBe(0);

      host.destroy();
      guest.destroy();
    });

    it('reconciles cleanly when host confirms action via TURN_ACTION_COMMIT', () => {
      const onActionCommitted = vi.fn();

      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'OPT2',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 10, lastAction: 'INIT' },
        reducer: testReducer,
      });

      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'OPT2',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        optimistic: true,
        initialState: { count: 10, lastAction: 'INIT' },
        reducer: testReducer,
        onActionCommitted,
      });

      advanceNetwork(50);

      guest.dispatch({ type: 'INCREMENT', by: 5 });
      expect(guest.getState().isOptimistic).toBe(true);
      expect(guest.getState().pendingActionsCount).toBe(1);

      // Let intent reach host and host commit return to guest
      advanceNetwork(80);

      expect(host.getState().seq).toBe(1);
      expect(host.getState().gameState.count).toBe(15);

      const reconciled = guest.getState();
      expect(reconciled.seq).toBe(1);
      expect(reconciled.gameState.count).toBe(15);
      expect(reconciled.isOptimistic).toBe(false);
      expect(reconciled.pendingActionsCount).toBe(0);
      expect(onActionCommitted).toHaveBeenCalledTimes(1);

      host.destroy();
      guest.destroy();
    });

    it('rolls back cleanly to authoritative state when host rejects invalid action', () => {
      const onActionRejected = vi.fn();

      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'OPT3',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 10, lastAction: 'INIT' },
        reducer: testReducer,
        validateAction: (_state, action) => {
          // Reject illegal moves
          return action.type !== 'ILLEGAL_MOVE';
        },
      });

      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'OPT3',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        optimistic: true,
        initialState: { count: 10, lastAction: 'INIT' },
        reducer: testReducer,
        onActionRejected,
      });

      advanceNetwork(50);

      // Guest optimistically attempts an illegal move
      guest.dispatch({ type: 'ILLEGAL_MOVE', value: 999 });

      // Synchronously, guest reflects speculative state
      expect(guest.getState().gameState.count).toBe(1009);
      expect(guest.getState().isOptimistic).toBe(true);
      expect(guest.getState().pendingActionsCount).toBe(1);

      // Network delivers intent to host -> host rejects -> reject delivered to guest
      advanceNetwork(80);

      // Host was never mutated
      expect(host.getState().gameState.count).toBe(10);
      expect(host.getState().seq).toBe(0);

      // Guest rolled back to authoritative count of 10
      const rolledBack = guest.getState();
      expect(rolledBack.gameState.count).toBe(10);
      expect(rolledBack.isOptimistic).toBe(false);
      expect(rolledBack.pendingActionsCount).toBe(0);
      expect(rolledBack.seq).toBe(0);

      expect(onActionRejected).toHaveBeenCalledTimes(1);
      expect(onActionRejected).toHaveBeenCalledWith(
        { type: 'ILLEGAL_MOVE', value: 999 },
        'guest_p2',
        { count: 10, lastAction: 'INIT' },
      );

      host.destroy();
      guest.destroy();
    });

    it('handles multiple queued optimistic actions with partial confirmation and rollback', () => {
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'OPT4',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 100, lastAction: 'INIT' },
        reducer: testReducer,
        validateAction: (_state, action) => {
          return action.type !== 'ILLEGAL_MOVE';
        },
      });

      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'OPT4',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        optimistic: true,
        initialState: { count: 100, lastAction: 'INIT' },
        reducer: testReducer,
      });

      advanceNetwork(50);

      // Dispatch two valid optimistic actions in queue (+5, then +10)
      guest.dispatch({ type: 'INCREMENT', by: 5 });
      guest.dispatch({ type: 'INCREMENT', by: 10 });

      expect(guest.getState().pendingActionsCount).toBe(2);
      expect(guest.getState().isOptimistic).toBe(true);
      expect(guest.getState().gameState.count).toBe(115);

      // Advance network to let host commit both
      advanceNetwork(120);

      // Host committed both actions
      expect(host.getState().gameState.count).toBe(115);
      expect(host.getState().seq).toBe(2);

      // Guest reconciled both actions cleanly
      expect(guest.getState().gameState.count).toBe(115);
      expect(guest.getState().isOptimistic).toBe(false);
      expect(guest.getState().pendingActionsCount).toBe(0);
      expect(guest.getState().seq).toBe(2);

      host.destroy();
      guest.destroy();
    });
  });

  describe('4. Automated Host Migration', () => {
    it('elects surviving peer with earliest joinedAt when host drops out', () => {
      const onHostMigratedP2 = vi.fn();
      const onHostMigratedP3 = vi.fn();

      // Host connects at t ~ 0
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'MIGR1',
        playerId: 'p1_host',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });
      advanceNetwork(30);

      // Guest 1 joins at t ~ 50
      vi.advanceTimersByTime(20);
      const guest1 = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'MIGR1',
        playerId: 'p2_guest',
        playerName: 'Guest1',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
        onHostMigrated: onHostMigratedP2,
      });
      advanceNetwork(40);

      // Guest 2 joins at t ~ 100
      vi.advanceTimersByTime(20);
      const guest2 = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'MIGR1',
        playerId: 'p3_guest',
        playerName: 'Guest2',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
        onHostMigrated: onHostMigratedP3,
      });
      advanceNetwork(50);

      // Original host commits an action to reach seq = 1
      host.dispatch({ type: 'INCREMENT', by: 2 });
      advanceNetwork(50);

      expect(host.getState().seq).toBe(1);
      expect(guest1.getState().seq).toBe(1);
      expect(guest2.getState().seq).toBe(1);

      // Host disconnects / drops out
      host.relay.disconnect();

      // Simulated network routes peer_left to surviving peers
      advanceNetwork(50);

      // Guest 1 had joined earlier than Guest 2 -> elected as new host!
      expect(guest1.relay.getState().isHost).toBe(true);
      expect(guest2.relay.getState().isHost).toBe(false);

      expect(onHostMigratedP2).toHaveBeenCalledWith('p2_guest', true, 1);
      expect((guest2 as unknown as { lastKnownHostId?: string }).lastKnownHostId).toBe('p2_guest');

      // Guest 2 dispatches an action to the new host (Guest 1)
      guest2.dispatch({ type: 'INCREMENT', by: 8 });
      advanceNetwork(80);

      // The new host committed the action, seq = 2
      expect(guest1.getState().seq).toBe(2);
      expect(guest1.getState().gameState.count).toBe(10);

      // Guest 2 receives commit from new host
      expect(guest2.getState().seq).toBe(2);
      expect(guest2.getState().gameState.count).toBe(10);

      host.destroy();
      guest1.destroy();
      guest2.destroy();
    });

    it('resumes turn countdown timer on newly elected host if turnDurationMs configured', () => {
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'MIGR2',
        playerId: 'p1_host',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });
      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'MIGR2',
        playerId: 'p2_guest',
        playerName: 'Guest',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        turnDurationMs: 4000,
        timerTickMs: 500,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });
      advanceNetwork(50);

      expect(guest.getState().turnDeadline).toBeNull();

      // Host drops
      host.relay.disconnect();
      advanceNetwork(50);

      // Guest is promoted to host and resumes timer
      expect(guest.relay.getState().isHost).toBe(true);
      expect(guest.getState().turnDeadline).toBeGreaterThan(0);
      expect(guest.getState().remainingTurnMs).toBe(4000);

      host.destroy();
      guest.destroy();
    });

    it('deterministic tie-breaker selects lexicographically smallest peer ID when joinedAt identical', () => {
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'MIGR3',
        playerId: 'host_0',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });
      advanceNetwork(30);

      // Create two peers at the same exact timestamp
      const peerA = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'MIGR3',
        playerId: 'peer_alpha',
        playerName: 'Alpha',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      const peerB = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'MIGR3',
        playerId: 'peer_omega',
        playerName: 'Omega',
        isHost: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });

      advanceNetwork(50);

      // Host leaves
      host.relay.disconnect();
      advanceNetwork(50);

      // 'peer_alpha' < 'peer_omega' lexicographically -> peer_alpha is elected
      expect(peerA.relay.getState().isHost).toBe(true);
      expect(peerB.relay.getState().isHost).toBe(false);

      host.destroy();
      peerA.destroy();
      peerB.destroy();
    });

    it('does not elect or promote when autoHostMigration is false', () => {
      const host = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'MIGR4',
        playerId: 'host_p1',
        playerName: 'Host',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });
      advanceNetwork(30);

      const guest = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'MIGR4',
        playerId: 'guest_p2',
        playerName: 'Guest',
        isHost: false,
        autoHostMigration: false,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 0, lastAction: 'INIT' },
        reducer: testReducer,
      });
      advanceNetwork(50);

      host.relay.disconnect();
      advanceNetwork(50);

      expect(guest.relay.getState().isHost).toBe(false);

      host.destroy();
      guest.destroy();
    });
  });

  describe('5. React Hook useTurnEngine Integration', () => {
    it('provides reactive updates through useTurnEngine hook', () => {
      const { result, unmount } = renderHook(() =>
        useTurnEngine<TestGameState, TestAction>({
          roomCode: 'HOOK1',
          playerId: 'host_react',
          playerName: 'HostReact',
          isHost: true,
          simulatedLatencyMs: 10,
          simulatedHub: hub,
          autoConnect: true,
          initialState: { count: 10, lastAction: 'INIT' },
          reducer: testReducer,
        }),
      );

      expect(result.current.gameState.count).toBe(10);
      expect(result.current.seq).toBe(0);

      act(() => {
        result.current.dispatch({ type: 'INCREMENT', by: 5 });
      });

      expect(result.current.gameState.count).toBe(15);
      expect(result.current.seq).toBe(1);

      unmount();
    });

    it('subscribes to external engine without tearing down on unmount', () => {
      const engine = createTurnEngine<TestGameState, TestAction>({
        roomCode: 'HOOK2',
        playerId: 'host_ext',
        playerName: 'HostExt',
        isHost: true,
        simulatedLatencyMs: 10,
        simulatedHub: hub,
        autoConnect: true,
        initialState: { count: 20, lastAction: 'INIT' },
        reducer: testReducer,
      });

      const { result, unmount } = renderHook(() =>
        useTurnEngine<TestGameState, TestAction>({ engine }),
      );

      expect(result.current.gameState.count).toBe(20);

      act(() => {
        engine.dispatch({ type: 'INCREMENT', by: 10 });
      });

      expect(result.current.gameState.count).toBe(30);

      unmount();

      // External engine is not destroyed by unmount
      expect(engine.relay.isDestroyed()).toBe(false);
      engine.dispatch({ type: 'INCREMENT', by: 5 });
      expect(engine.getState().gameState.count).toBe(35);

      engine.destroy();
    });
  });
});
