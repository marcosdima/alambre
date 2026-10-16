import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateRoomCode,
  SimulatedRelayTransport,
} from '@alambre/room-relay';

describe('generateRoomCode', () => {
  it('returns a 4-character uppercase alphanumeric string without ambiguous characters', () => {
    const ambiguousChars = ['0', '1', 'O', 'I'];
    const validCharsetRegex = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(4);
      expect(code).toMatch(validCharsetRegex);
      for (const char of ambiguousChars) {
        expect(code).not.toContain(char);
      }
    }
  });

  it('generates unique codes across invocations', () => {
    const codes = new Set<string>();
    const count = 100;

    for (let i = 0; i < count; i++) {
      codes.add(generateRoomCode());
    }

    // With 32^4 (~1 million) combinations, 100 random samples should have high diversity.
    expect(codes.size).toBeGreaterThanOrEqual(95);
  });
});

describe('SimulatedRelayTransport', () => {
  const activeTransports: SimulatedRelayTransport[] = [];

  const createTransport = (
    id: string,
    name: string,
    roomCode: string,
    isHost: boolean,
    latencyMs = 20,
  ) => {
    const transport = new SimulatedRelayTransport(id, name, roomCode, isHost, latencyMs);
    activeTransports.push(transport);
    return transport;
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    for (const transport of activeTransports) {
      transport.destroy();
    }
    activeTransports.length = 0;
    vi.runAllTimers();
    vi.useRealTimers();
  });

  describe('status changes', () => {
    it('transitions through connecting, connected, and disconnected states', () => {
      const statuses: string[] = [];
      const latencyMs = 25;
      const transport = createTransport('peer-1', 'Alice', 'STATUS_ROOM_1', true, latencyMs);

      transport.onStatusChange((status) => {
        statuses.push(status);
      });

      // Initially idle, connect triggers 'connecting' synchronously
      transport.connect();
      expect(statuses).toEqual(['connecting']);

      // After latency delay, status updates to 'connected'
      vi.advanceTimersByTime(latencyMs);
      expect(statuses).toEqual(['connecting', 'connected']);

      // Disconnect triggers 'disconnected'
      transport.disconnect();
      expect(statuses).toEqual(['connecting', 'connected', 'disconnected']);
    });

    it('clears handlers and leaves room on destroy', () => {
      const statuses: string[] = [];
      const messages: unknown[] = [];
      const transport = createTransport('peer-1', 'Alice', 'STATUS_ROOM_2', true, 20);

      transport.onStatusChange((status) => statuses.push(status));
      transport.onMessage((msg) => messages.push(msg));

      transport.connect();
      vi.advanceTimersByTime(20);
      expect(statuses).toEqual(['connecting', 'connected']);

      messages.length = 0;
      transport.destroy();
      expect(statuses).toEqual(['connecting', 'connected', 'disconnected']);

      // Attempting to send after destroy should not invoke messageHandler
      transport.send({ type: 'ping', sentAt: 100 });
      vi.runAllTimers();
      expect(messages).toHaveLength(0);
    });
  });

  describe('peer message broadcast', () => {
    it('broadcasts messages between peers in the same room', () => {
      const roomCode = 'BROADCAST_ROOM_1';
      const latencyMs = 15;
      const peerA = createTransport('peer-a', 'Alice', roomCode, true, latencyMs);
      const peerB = createTransport('peer-b', 'Bob', roomCode, false, latencyMs);

      const peerAMessages: unknown[] = [];
      const peerBMessages: unknown[] = [];

      peerA.onMessage((msg) => peerAMessages.push(msg));
      peerB.onMessage((msg) => peerBMessages.push(msg));

      // Connect Peer A
      peerA.connect();
      vi.advanceTimersByTime(latencyMs);

      expect(peerAMessages).toContainEqual({
        type: 'room_joined',
        roomCode,
        peers: [],
      });

      // Connect Peer B
      peerB.connect();
      vi.advanceTimersByTime(latencyMs);

      expect(peerBMessages).toContainEqual(
        expect.objectContaining({
          type: 'room_joined',
          roomCode,
          peers: [
            expect.objectContaining({
              id: 'peer-a',
              name: 'Alice',
              isHost: true,
            }),
          ],
        }),
      );

      // Advance timers for peer_joined notification to Peer A
      vi.runAllTimers();

      expect(peerAMessages).toContainEqual(
        expect.objectContaining({
          type: 'peer_joined',
          peer: expect.objectContaining({
            id: 'peer-b',
            name: 'Bob',
            isHost: false,
          }),
        }),
      );

      // Broadcast message from Peer A to room
      const payloadA = { type: 'play_card', cardId: 'queen_spades', round: 1 };
      peerA.send(payloadA);

      vi.runAllTimers();

      // Peer B received it, Peer A did not receive its own broadcast
      expect(peerBMessages).toContainEqual(payloadA);
      expect(peerAMessages).not.toContainEqual(payloadA);

      // Broadcast message from Peer B to room
      const payloadB = { type: 'chat', text: 'Nice move!' };
      peerB.send(payloadB);

      vi.runAllTimers();

      // Peer A received it, Peer B did not receive its own broadcast
      expect(peerAMessages).toContainEqual(payloadB);
      expect(peerBMessages).not.toContainEqual(payloadB);
    });

    it('does not leak broadcasts across different rooms', () => {
      const latencyMs = 10;
      const room1Peer = createTransport('p1', 'Player 1', 'ROOM_ALPHA', true, latencyMs);
      const room2Peer = createTransport('p2', 'Player 2', 'ROOM_BETA', true, latencyMs);

      const room1Messages: unknown[] = [];
      const room2Messages: unknown[] = [];

      room1Peer.onMessage((msg) => room1Messages.push(msg));
      room2Peer.onMessage((msg) => room2Messages.push(msg));

      room1Peer.connect();
      room2Peer.connect();
      vi.runAllTimers();

      room1Messages.length = 0;
      room2Messages.length = 0;

      // Broadcast in Room 1
      room1Peer.send({ type: 'secret_message', text: 'for room alpha only' });
      vi.runAllTimers();

      expect(room2Messages).toHaveLength(0);
      expect(room1Messages).toHaveLength(0); // Senders do not receive their own broadcast
    });

    it('notifies peer when another peer leaves the room', () => {
      const roomCode = 'LEAVE_ROOM_1';
      const latencyMs = 15;
      const peerA = createTransport('peer-a', 'Alice', roomCode, true, latencyMs);
      const peerB = createTransport('peer-b', 'Bob', roomCode, false, latencyMs);

      const peerAMessages: unknown[] = [];
      peerA.onMessage((msg) => peerAMessages.push(msg));

      peerA.connect();
      peerB.connect();
      vi.runAllTimers();

      // Disconnect Peer B
      peerB.disconnect();
      vi.runAllTimers();

      expect(peerAMessages).toContainEqual({
        type: 'peer_left',
        peerId: 'peer-b',
      });
    });
  });

  describe('ping/pong latency measurement handling', () => {
    it('replies with pong after double latencyMs without broadcasting to room', () => {
      const roomCode = 'PING_ROOM_1';
      const latencyMs = 20;
      const peerA = createTransport('peer-a', 'Alice', roomCode, true, latencyMs);
      const peerB = createTransport('peer-b', 'Bob', roomCode, false, latencyMs);

      const peerAMessages: unknown[] = [];
      const peerBMessages: unknown[] = [];

      peerA.onMessage((msg) => peerAMessages.push(msg));
      peerB.onMessage((msg) => peerBMessages.push(msg));

      peerA.connect();
      peerB.connect();
      vi.runAllTimers();

      peerAMessages.length = 0;
      peerBMessages.length = 0;

      const sentAt = 123456789;
      peerA.send({ type: 'ping', sentAt });

      // Before latencyMs * 2 (40ms), pong should not have fired yet
      vi.advanceTimersByTime(35);
      expect(peerAMessages).toHaveLength(0);
      expect(peerBMessages).toHaveLength(0);

      // Advance past 40ms
      vi.advanceTimersByTime(10);
      expect(peerAMessages).toContainEqual({
        type: 'pong',
        sentAt,
      });

      // Verify Peer B NEVER received the ping or pong
      expect(peerBMessages).toHaveLength(0);
    });
  });
});
