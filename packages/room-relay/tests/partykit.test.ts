import { describe, it, expect } from 'vitest';
import RelayServer, {
  type PartyConnection,
  type PartyRoom,
  type RelayPeerMeta,
} from '../partykit/server';

class MockPartyConnection implements PartyConnection<RelayPeerMeta> {
  id: string;
  state: RelayPeerMeta | null = null;
  sentMessages: string[] = [];
  closed = false;

  constructor(id: string) {
    this.id = id;
  }

  setState(state: RelayPeerMeta | ((prev: RelayPeerMeta | null) => RelayPeerMeta | null)): void {
    if (typeof state === 'function') {
      this.state = state(this.state);
    } else {
      this.state = state;
    }
  }

  send(message: string): void {
    this.sentMessages.push(message);
  }

  close(): void {
    this.closed = true;
  }
}

class MockPartyRoom implements PartyRoom<RelayPeerMeta> {
  id: string;
  env: Record<string, unknown> = {};
  connections = new Map<string, MockPartyConnection>();

  constructor(id: string) {
    this.id = id;
  }

  getConnections<T = RelayPeerMeta>(): Iterable<PartyConnection<T>> {
    return this.connections.values() as Iterable<PartyConnection<T>>;
  }

  getConnection<T = RelayPeerMeta>(id: string): PartyConnection<T> | undefined {
    return this.connections.get(id) as PartyConnection<T> | undefined;
  }

  broadcast(message: string, without?: string[]): void {
    const skip = new Set(without ?? []);
    for (const conn of this.connections.values()) {
      if (!skip.has(conn.id)) {
        conn.send(message);
      }
    }
  }

  addConnection(conn: MockPartyConnection) {
    this.connections.set(conn.id, conn);
  }

  removeConnection(id: string) {
    this.connections.delete(id);
  }
}

describe('PartyKit Edge Relay Server Integration', () => {
  it('connects two apps/peers and allows bidirectional message exchange', () => {
    const room = new MockPartyRoom('ARENA1');
    const server = new RelayServer(room);

    // 1. App 1 (Alice) connects as Host
    const app1Conn = new MockPartyConnection('conn_alice');
    room.addConnection(app1Conn);

    const app1Ctx = {
      request: new Request('https://relay.alambre.party/parties/relay/ARENA1?id=alice_1&name=Alice&isHost=true'),
    };
    server.onConnect(app1Conn, app1Ctx);

    // Verify App 1 gets room_joined with 0 peers
    expect(app1Conn.sentMessages).toHaveLength(1);
    const app1Joined = JSON.parse(app1Conn.sentMessages[0]!);
    expect(app1Joined).toEqual({
      type: 'room_joined',
      roomCode: 'ARENA1',
      peers: [],
    });

    // 2. App 2 (Bob) connects as Guest
    const app2Conn = new MockPartyConnection('conn_bob');
    room.addConnection(app2Conn);

    const app2Ctx = {
      request: new Request('https://relay.alambre.party/parties/relay/ARENA1?id=bob_2&name=Bob&isHost=false'),
    };
    server.onConnect(app2Conn, app2Ctx);

    // Verify App 2 gets room_joined listing Alice
    expect(app2Conn.sentMessages).toHaveLength(1);
    const app2Joined = JSON.parse(app2Conn.sentMessages[0]!);
    expect(app2Joined.type).toBe('room_joined');
    expect(app2Joined.peers).toEqual([
      { id: 'alice_1', name: 'Alice', isHost: true },
    ]);

    // Verify App 1 gets peer_joined notification about Bob
    expect(app1Conn.sentMessages).toHaveLength(2);
    const app1PeerJoined = JSON.parse(app1Conn.sentMessages[1]!);
    expect(app1PeerJoined).toEqual({
      type: 'peer_joined',
      peer: { id: 'bob_2', name: 'Bob', isHost: false },
    });

    // 3. App 1 sends a game message: 'PLAY_CARD'
    const cardMsg = JSON.stringify({
      id: 'msg_101',
      from: 'alice_1',
      type: 'PLAY_CARD',
      payload: { cardId: 'shield_alpha', power: 50 },
    });
    server.onMessage(cardMsg, app1Conn);

    // Verify Bob receives the card message, but Alice does not receive duplicate
    expect(app2Conn.sentMessages).toHaveLength(2);
    expect(JSON.parse(app2Conn.sentMessages[1]!)).toEqual({
      id: 'msg_101',
      from: 'alice_1',
      type: 'PLAY_CARD',
      payload: { cardId: 'shield_alpha', power: 50 },
    });
    expect(app1Conn.sentMessages).toHaveLength(2); // No echo

    // 4. App 2 sends a reply message: 'COUNTER_ATTACK'
    const replyMsg = JSON.stringify({
      id: 'msg_102',
      from: 'bob_2',
      type: 'COUNTER_ATTACK',
      payload: { responseCard: 'lightning_strike', damage: 75 },
    });
    server.onMessage(replyMsg, app2Conn);

    // Verify Alice receives Bob's response
    expect(app1Conn.sentMessages).toHaveLength(3);
    expect(JSON.parse(app1Conn.sentMessages[2]!)).toEqual({
      id: 'msg_102',
      from: 'bob_2',
      type: 'COUNTER_ATTACK',
      payload: { responseCard: 'lightning_strike', damage: 75 },
    });

    // 5. Ping / Pong latency check
    server.onMessage(JSON.stringify({ type: 'ping', sentAt: 12345 }), app1Conn);
    expect(app1Conn.sentMessages).toHaveLength(4);
    expect(JSON.parse(app1Conn.sentMessages[3]!)).toEqual({
      type: 'pong',
      sentAt: 12345,
    });

    // 6. App 2 leaves / disconnects
    room.removeConnection(app2Conn.id);
    server.onClose(app2Conn);

    // Verify Alice is notified of Bob leaving
    expect(app1Conn.sentMessages).toHaveLength(5);
    expect(JSON.parse(app1Conn.sentMessages[4]!)).toEqual({
      type: 'peer_left',
      peerId: 'bob_2',
    });
  });
});
