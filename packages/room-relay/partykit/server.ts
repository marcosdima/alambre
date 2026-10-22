/**
 * PartyKit Edge Room Relay Server
 *
 * Ephemeral multi-device room synchronization on Cloudflare Workers / PartyKit.
 * Deploys instantly to edge with: `npx partykit deploy`
 */

export interface PartyConnection<TState = any> {
  id: string;
  state: TState | null;
  setState(state: TState | ((prev: TState | null) => TState | null)): void;
  send(message: string): void;
  close(): void;
}

export interface PartyRoom<TState = any> {
  id: string;
  env: Record<string, unknown>;
  getConnections<T = TState>(): Iterable<PartyConnection<T>>;
  getConnection<T = TState>(id: string): PartyConnection<T> | undefined;
  broadcast(message: string, without?: string[]): void;
}

export interface PartyConnectionContext {
  request: Request;
}

export interface PartyServer<TState = any> {
  onConnect?(conn: PartyConnection<TState>, ctx: PartyConnectionContext): void | Promise<void>;
  onMessage?(message: string | ArrayBuffer, sender: PartyConnection<TState>): void | Promise<void>;
  onClose?(conn: PartyConnection<TState>): void | Promise<void>;
  onError?(conn: PartyConnection<TState>, error: Error): void | Promise<void>;
}

export interface RelayPeerMeta {
  id: string;
  name: string;
  isHost: boolean;
}

export default class RelayServer implements PartyServer<RelayPeerMeta> {
  constructor(readonly room: PartyRoom<RelayPeerMeta>) {}

  onConnect(conn: PartyConnection<RelayPeerMeta>, ctx: PartyConnectionContext) {
    let id = conn.id;
    let name = 'Anonymous';
    let isHost = false;

    try {
      const url = new URL(ctx.request.url);
      const qId = url.searchParams.get('id');
      const qName = url.searchParams.get('name');
      const qHost = url.searchParams.get('isHost');

      if (qId) id = qId;
      if (qName) name = decodeURIComponent(qName);
      if (qHost === 'true') isHost = true;
    } catch {
      // Fallback to defaults
    }

    conn.setState({ id, name, isHost });

    // Gather existing peers in room
    const peers: RelayPeerMeta[] = [];
    for (const other of this.room.getConnections<RelayPeerMeta>()) {
      if (other.id !== conn.id && other.state) {
        peers.push(other.state);
      }
    }

    // Send room_joined to the new connection
    conn.send(
      JSON.stringify({
        type: 'room_joined',
        roomCode: this.room.id,
        peers,
      }),
    );

    // Broadcast peer_joined to all other peers in the room
    this.room.broadcast(
      JSON.stringify({
        type: 'peer_joined',
        peer: { id, name, isHost },
      }),
      [conn.id],
    );
  }

  onMessage(message: string | ArrayBuffer, sender: PartyConnection<RelayPeerMeta>) {
    if (typeof message !== 'string') return;

    try {
      const data = JSON.parse(message);

      // Heartbeat ping / pong
      if (data && data.type === 'ping') {
        sender.send(
          JSON.stringify({
            type: 'pong',
            sentAt: data.sentAt,
          }),
        );
        return;
      }

      // Handshake join
      if (data && data.type === 'join') {
        sender.setState({
          id: data.id || sender.id,
          name: data.name || 'Anonymous',
          isHost: Boolean(data.isHost),
        });
        return;
      }

      // Broadcast regular relay messages to other peers
      this.room.broadcast(message, [sender.id]);
    } catch {
      // Ignore malformed packets
    }
  }

  onClose(conn: PartyConnection<RelayPeerMeta>) {
    const state = conn.state;
    if (state) {
      this.room.broadcast(
        JSON.stringify({
          type: 'peer_left',
          peerId: state.id,
        }),
      );
    }
  }
}
