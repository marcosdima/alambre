/**
 * Cloudflare Worker + Durable Objects Room Relay
 *
 * Provides global, sub-10ms edge routing for real-time multiplayer rooms.
 * Each room code maps deterministically to an edge Durable Object instance.
 */

export interface Env {
  ROOM_DO: DurableObjectNamespace;
}

interface PeerInfo {
  id: string;
  name: string;
  isHost: boolean;
  ws: WebSocket;
}

export class RoomDurableObject implements DurableObject {
  private peers = new Map<string, PeerInfo>();

  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const url = new URL(request.url);
    const peerId = url.searchParams.get('id') || ('p_' + Math.random().toString(36).substring(2, 8));
    const peerName = decodeURIComponent(url.searchParams.get('name') || 'Anonymous');
    const isHost = url.searchParams.get('host') === 'true';

    const webSocketPair = new WebSocketPair();
    const [clientWs, serverWs] = Object.values(webSocketPair);

    // Accept WebSocket connection on the Durable Object server side
    serverWs.accept();

    const peer: PeerInfo = {
      id: peerId,
      name: peerName,
      isHost,
      ws: serverWs,
    };

    this.peers.set(peerId, peer);

    // 1. Send room_joined handshake with current room peers
    const existingPeers = Array.from(this.peers.values())
      .filter((p) => p.id !== peerId)
      .map((p) => ({ id: p.id, name: p.name, isHost: p.isHost }));

    serverWs.send(
      JSON.stringify({
        type: 'room_joined',
        peers: existingPeers,
      }),
    );

    // 2. Broadcast peer_joined to all other peers in the room
    this.broadcast(
      {
        type: 'peer_joined',
        peer: { id: peer.id, name: peer.name, isHost: peer.isHost },
      },
      peerId,
    );

    // 3. Message handling
    serverWs.addEventListener('message', (event) => {
      try {
        const raw = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const type = raw?.type;

        // Heartbeat ping
        if (type === 'ping') {
          serverWs.send(
            JSON.stringify({
              type: 'pong',
              sentAt: raw.sentAt ?? Date.now(),
              serverTime: Date.now(),
            }),
          );
          return;
        }

        // Broadcast standard message to peers
        this.broadcast(raw, raw?.targetPeerId ? undefined : peerId, raw?.targetPeerId);
      } catch (_err) {
        // Ignore unparseable frames
      }
    });

    // 4. Disconnect handling
    const handleClose = () => {
      this.peers.delete(peerId);
      this.broadcast({
        type: 'peer_left',
        peerId,
      });
    };

    serverWs.addEventListener('close', handleClose);
    serverWs.addEventListener('error', handleClose);

    return new Response(null, {
      status: 101,
      webSocket: clientWs,
    });
  }

  private broadcast(payload: unknown, excludePeerId?: string, targetPeerId?: string) {
    const data = JSON.stringify(payload);
    for (const [id, peer] of this.peers.entries()) {
      if (targetPeerId && id !== targetPeerId) continue;
      if (excludePeerId && id === excludePeerId) continue;
      try {
        peer.ws.send(data);
      } catch {
        // Socket closed or dead
      }
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Status / Healthcheck
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', runtime: 'cloudflare-worker' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Match /room/:roomCode
    const match = url.pathname.match(/^\/room\/([A-Z0-9]+)/i);
    const roomCode = (match ? match[1] : url.searchParams.get('room'))?.toUpperCase();

    if (!roomCode) {
      return new Response('Room code required (e.g. /room/XK89)', { status: 400 });
    }

    // Route to the unique Durable Object instance for this room code
    const id = env.ROOM_DO.idFromName(roomCode);
    const stub = env.ROOM_DO.get(id);

    return stub.fetch(request);
  },
};
