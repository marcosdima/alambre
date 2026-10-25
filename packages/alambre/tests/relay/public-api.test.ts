import { describe, it, expect } from 'vitest';
import * as RoomRelayAPI from '../../src/relay/index';

describe('Public API Contract: @some-alambre/room-relay', () => {
  it('exports room code utilities', () => {
    expect(RoomRelayAPI.ROOM_CODE_ALPHABET).toBeDefined();
    expect(typeof RoomRelayAPI.generateRoomCode).toBe('function');
    expect(typeof RoomRelayAPI.sanitizeRoomCode).toBe('function');
  });

  it('exports transport classes and factories', () => {
    expect(typeof RoomRelayAPI.SimulatedEdgeRelayHub).toBe('function');
    expect(typeof RoomRelayAPI.SimulatedRelayTransport).toBe('function');
    expect(typeof RoomRelayAPI.createSimulatedRelayHub).toBe('function');
    expect(RoomRelayAPI.defaultSimulatedHub).toBeDefined();
    expect(typeof RoomRelayAPI.WebSocketRelayTransport).toBe('function');
  });

  it('exports headless core client', () => {
    expect(typeof RoomRelayAPI.RoomRelayClient).toBe('function');
    expect(typeof RoomRelayAPI.createRoomRelay).toBe('function');
  });

  it('exports React hooks', () => {
    expect(typeof RoomRelayAPI.useRoomRelay).toBe('function');
    expect(typeof RoomRelayAPI.useRoomRelaySelector).toBe('function');
    expect(typeof RoomRelayAPI.useTurnEngine).toBe('function');
  });

  it('exports deterministic PRNG and authoritative turn engine', async () => {
    expect(typeof RoomRelayAPI.hashSeed).toBe('function');
    expect(typeof RoomRelayAPI.createSeededRng).toBe('function');
    expect(typeof RoomRelayAPI.shuffleWithSeed).toBe('function');
    expect(typeof RoomRelayAPI.TurnEngineClient).toBe('function');
    expect(typeof RoomRelayAPI.createTurnEngine).toBe('function');
    expect(RoomRelayAPI.TURN_ENGINE_EVENTS).toBeDefined();

    // Deterministic PRNG & shuffle verification
    const deck = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffleA = RoomRelayAPI.shuffleWithSeed(deck, 'ROOM_XK89_ROUND_1');
    const shuffleB = RoomRelayAPI.shuffleWithSeed(deck, 'ROOM_XK89_ROUND_1');
    const shuffleC = RoomRelayAPI.shuffleWithSeed(deck, 'ROOM_XK89_ROUND_2');

    expect(shuffleA).toEqual(shuffleB);
    expect(shuffleA).not.toEqual(shuffleC);
    expect(deck).toEqual([1, 2, 3, 4, 5, 6, 7, 8]); // non-mutating

    // Authoritative TurnEngine verification between Host and Guest over SimulatedHub
    const hub = RoomRelayAPI.createSimulatedRelayHub();
    type CounterState = { count: number; turn: 'host' | 'guest' };
    type CounterAction = { type: 'INC'; by: number };

    const reducer: RoomRelayAPI.TurnReducer<CounterState, CounterAction> = (
      state,
      action,
    ) => ({
      count: state.count + action.by,
      turn: state.turn === 'host' ? 'guest' : 'host',
    });

    const hostEngine = RoomRelayAPI.createTurnEngine<CounterState, CounterAction>({
      roomCode: 'TURN1',
      playerId: 'host_1',
      playerName: 'Host',
      isHost: true,
      mode: 'simulated',
      simulatedLatencyMs: 0,
      simulatedHub: hub,
      autoConnect: true,
      initialState: { count: 0, turn: 'host' },
      reducer,
    });

    const guestEngine = RoomRelayAPI.createTurnEngine<CounterState, CounterAction>({
      roomCode: 'TURN1',
      playerId: 'guest_1',
      playerName: 'Guest',
      isHost: false,
      mode: 'simulated',
      simulatedLatencyMs: 0,
      simulatedHub: hub,
      autoConnect: true,
      initialState: { count: 0, turn: 'host' },
      reducer,
    });

    const waitFor = async (fn: () => boolean, timeout = 400) => {
      const start = Date.now();
      while (!fn() && Date.now() - start < timeout) {
        await new Promise((r) => setTimeout(r, 10));
      }
    };

    await waitFor(() => hostEngine.relay.getState().status === 'connected' && guestEngine.relay.getState().status === 'connected');

    // Host dispatches action -> commits immediately and broadcasts to guest
    hostEngine.dispatch({ type: 'INC', by: 5 });
    await waitFor(() => guestEngine.getState().seq === 1);

    expect(hostEngine.getState().gameState).toEqual({ count: 5, turn: 'guest' });
    expect(hostEngine.getState().seq).toBe(1);
    expect(guestEngine.getState().gameState).toEqual({ count: 5, turn: 'guest' });
    expect(guestEngine.getState().seq).toBe(1);

    // Guest dispatches intent -> routed to host -> committed with seq=2 -> broadcast to guest
    guestEngine.dispatch({ type: 'INC', by: 3 });
    await waitFor(() => guestEngine.getState().seq === 2);

    expect(hostEngine.getState().gameState).toEqual({ count: 8, turn: 'host' });
    expect(hostEngine.getState().seq).toBe(2);
    expect(guestEngine.getState().gameState).toEqual({ count: 8, turn: 'host' });
    expect(guestEngine.getState().seq).toBe(2);

    hostEngine.destroy();
    guestEngine.destroy();
  });

  it('exports complete TypeScript type surface', () => {
    const status: RoomRelayAPI.RelayConnectionStatus = 'idle';
    const mode: RoomRelayAPI.RelayTransportMode = 'websocket';
    const peer: RoomRelayAPI.RelayPeer = { id: 'p1', name: 'Alice', isHost: true, lastSeen: Date.now() };
    const msg: RoomRelayAPI.RelayMessage = {
      id: 'm1',
      from: 'p1',
      type: 'TEST',
      payload: {},
      timestamp: 123456789,
    };
    const options: RoomRelayAPI.RoomRelayOptions = {
      roomCode: 'XK89',
      playerName: 'Alice',
      mode: 'simulated',
      autoConnect: false,
    };

    expect(status).toBe('idle');
    expect(mode).toBe('websocket');
    expect(peer.id).toBe('p1');
    expect(msg.type).toBe('TEST');
    expect(options.roomCode).toBe('XK89');
  });
});

