import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createPartyKitTransport,
  resolvePartyKitUrl,
} from '../../src/relay/transports/partykit';
import {
  createPartyKitRelay,
} from '../../src/relay/react/use-partykit-relay';
import * as PartyKitSubpath from '../../src/relay/partykit';

class MockWebSocket {
  static OPEN = 1;
  readyState = 0;
  sentMessages: string[] = [];

  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;

  constructor(readonly url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 5);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = 3;
    this.onclose?.(new CloseEvent('close'));
  }

  emitMessage(data: string) {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  emitError() {
    this.onerror?.(new Event('error'));
  }
}

describe('PartyKit URL Resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_PARTYKIT_HOST;
    delete process.env.EXPO_PUBLIC_RELAY_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('resolves default localhost url with query parameters', () => {
    const url = resolvePartyKitUrl({
      room: 'xk89',
      id: 'player_1',
      name: 'Alice',
      isHost: true,
    });

    expect(url).toBe('ws://localhost:1999/parties/main/XK89?id=player_1&name=Alice&isHost=true');
  });

  it('includes password parameter when provided', () => {
    const url = resolvePartyKitUrl({
      room: 'PASS1',
      id: 'p1',
      name: 'Alice',
      password: 'secret_pin_99',
    });

    expect(url).toBe('ws://localhost:1999/parties/main/PASS1?id=p1&name=Alice&password=secret_pin_99');
  });

  it('respects custom party name', () => {
    const url = resolvePartyKitUrl({
      host: 'localhost:1999',
      party: 'relay',
      room: 'ARENA1',
      id: 'p1',
      name: 'Bob',
    });

    expect(url).toBe('ws://localhost:1999/parties/relay/ARENA1?id=p1&name=Bob');
  });

  it('automatically picks up EXPO_PUBLIC_PARTYKIT_HOST from environment', () => {
    process.env.EXPO_PUBLIC_PARTYKIT_HOST = 'my-party.user.partykit.dev';

    const url = resolvePartyKitUrl({
      room: 'room42',
      id: 'u123',
      name: 'Charlie',
      isHost: false,
    });

    expect(url).toBe('wss://my-party.user.partykit.dev/parties/main/ROOM42?id=u123&name=Charlie&isHost=false');
  });

  it('automatically falls back to EXPO_PUBLIC_RELAY_URL if PARTYKIT_HOST is absent', () => {
    process.env.EXPO_PUBLIC_RELAY_URL = 'wss://custom-relay.edge.workers.dev';

    const url = resolvePartyKitUrl({
      room: 'CF01',
      id: 'u999',
      name: 'David',
    });

    expect(url).toBe('wss://custom-relay.edge.workers.dev/parties/main/CF01?id=u999&name=David');
  });

  it('converts http/https schemes to ws/wss correctly', () => {
    const httpUrl = resolvePartyKitUrl({
      host: 'http://127.0.0.1:1999',
      room: 'HTTP1',
    });
    expect(httpUrl).toBe('ws://127.0.0.1:1999/parties/main/HTTP1');

    const httpsUrl = resolvePartyKitUrl({
      host: 'https://my-app.partykit.dev',
      room: 'HTTPS1',
    });
    expect(httpsUrl).toBe('wss://my-app.partykit.dev/parties/main/HTTPS1');
  });

  it('strips trailing slashes and nested /parties path fragments cleanly', () => {
    const url = resolvePartyKitUrl({
      host: 'https://my-app.partykit.dev/parties///',
      room: 'CLEAN1',
      id: 'c1',
    });
    expect(url).toBe('wss://my-app.partykit.dev/parties/main/CLEAN1?id=c1');
  });

  it('handles Android emulator IP 10.0.2.2 as local ws://', () => {
    const url = resolvePartyKitUrl({
      host: '10.0.2.2:1999',
      room: 'DROID1',
      isProduction: false,
    });
    expect(url).toBe('ws://10.0.2.2:1999/parties/main/DROID1');
  });
});

describe('PartyKitRelayTransport Client Adapter', () => {
  it('initializes and performs room handshake on connection', async () => {
    let capturedSocket: MockWebSocket | null = null;
    const socketFactory = (url: string) => {
      capturedSocket = new MockWebSocket(url);
      return capturedSocket as unknown as WebSocket;
    };

    const transport = createPartyKitTransport({
      host: 'localhost:1999',
      party: 'relay',
      roomCode: 'ARENA1',
      id: 'alice_1',
      name: 'Alice',
      isHost: true,
      webSocketFactory: socketFactory,
    });

    const statusUpdates: string[] = [];
    transport.onStatusChange((status) => {
      statusUpdates.push(status);
    });

    transport.connect();
    expect(statusUpdates).toContain('connecting');

    // Wait for mock connection to open
    await new Promise((r) => setTimeout(r, 20));

    expect(statusUpdates).toContain('connected');
    expect(capturedSocket).toBeDefined();
    expect(capturedSocket!.url).toBe(
      'ws://localhost:1999/parties/relay/ARENA1?id=alice_1&name=Alice&isHost=true',
    );

    // Verify join handshake was dispatched
    expect(capturedSocket!.sentMessages).toHaveLength(1);
    const joinPacket = JSON.parse(capturedSocket!.sentMessages[0]!);
    expect(joinPacket).toEqual({
      type: 'join',
      id: 'alice_1',
      name: 'Alice',
      roomCode: 'ARENA1',
      isHost: true,
    });

    // Send payload through transport
    transport.send({ type: 'PLAY_CARD', card: 'ace' });
    expect(capturedSocket!.sentMessages).toHaveLength(2);
    expect(JSON.parse(capturedSocket!.sentMessages[1]!)).toEqual({
      type: 'PLAY_CARD',
      card: 'ace',
    });

    // Receive incoming message
    const received: unknown[] = [];
    transport.onMessage((msg) => received.push(msg));
    capturedSocket!.emitMessage(JSON.stringify({ type: 'CARD_ACCEPTED', ok: true }));

    expect(received).toEqual([{ type: 'CARD_ACCEPTED', ok: true }]);

    // Disconnect
    transport.disconnect();
    expect(statusUpdates).toContain('disconnected');

    transport.destroy();
  });
});

describe('createPartyKitRelay Headless Integration', () => {
  it('configures RoomRelayClient with PartyKitRelayTransport', async () => {
    let capturedSocket: MockWebSocket | null = null;
    const socketFactory = (url: string) => {
      capturedSocket = new MockWebSocket(url);
      return capturedSocket as unknown as WebSocket;
    };

    const client = createPartyKitRelay({
      host: 'test-party.dev',
      party: 'game',
      roomCode: 'GAME99',
      playerId: 'p_head',
      playerName: 'HeadlessPlayer',
      isHost: false,
      autoConnect: true,
      webSocketFactory: socketFactory,
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(client.getState().roomCode).toBe('GAME99');
    expect(client.getState().playerName).toBe('HeadlessPlayer');
    expect(capturedSocket).toBeDefined();
    expect(capturedSocket!.url).toBe(
      'wss://test-party.dev/parties/game/GAME99?id=p_head&name=HeadlessPlayer&isHost=false',
    );

    client.destroy();
  });
});

describe('PartyKit Subpath Exports', () => {
  it('exposes all client adapters, hooks, and server blueprints', () => {
    expect(typeof PartyKitSubpath.PartyKitRelayTransport).toBe('function');
    expect(typeof PartyKitSubpath.createPartyKitTransport).toBe('function');
    expect(typeof PartyKitSubpath.resolvePartyKitUrl).toBe('function');
    expect(typeof PartyKitSubpath.usePartyKitRelay).toBe('function');
    expect(typeof PartyKitSubpath.createPartyKitRelay).toBe('function');
    expect(typeof PartyKitSubpath.RelayServer).toBe('function');
  });
});
