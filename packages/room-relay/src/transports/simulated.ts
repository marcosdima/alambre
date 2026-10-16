import type { RelayConnectionStatus, RelayPeer, RelayTransport } from "../types";
import { sanitizeRoomCode } from "../code";

export interface SimulatedHubClient {
  id: string;
  name: string;
  isHost: boolean;
  roomCode: string;
  receive: (msg: Record<string, unknown>) => void;
  setStatus: (status: RelayConnectionStatus, error?: string) => void;
  isDestroyed: () => boolean;
}

/**
 * In-memory simulated edge relay hub.
 *
 * Simulates a globally distributed WebSocket edge router (e.g. Cloudflare Durable Objects / PartyKit)
 * in pure JS memory without requiring internet access or running servers.
 */
export class SimulatedEdgeRelayHub {
  private rooms = new Map<string, Set<SimulatedHubClient>>();

  /**
   * Connects a client to a simulated room.
   */
  join(client: SimulatedHubClient, latencyMs = 35) {
    const code = sanitizeRoomCode(client.roomCode);
    if (!this.rooms.has(code)) {
      this.rooms.set(code, new Set());
    }
    const room = this.rooms.get(code)!;

    // Simulate edge handshake delay
    setTimeout(() => {
      if (client.isDestroyed()) return;
      room.add(client);
      client.setStatus("connected");

      // Current peers already in room
      const existingPeers: RelayPeer[] = Array.from(room)
        .filter((c) => c.id !== client.id && !c.isDestroyed())
        .map((c) => ({
          id: c.id,
          name: c.name,
          isHost: c.isHost,
          lastSeen: Date.now(),
        }));

      client.receive({
        type: "room_joined",
        roomCode: code,
        peers: existingPeers,
      });

      // Broadcast new peer to existing room members
      const newPeer: RelayPeer = {
        id: client.id,
        name: client.name,
        isHost: client.isHost,
        lastSeen: Date.now(),
      };

      for (const peer of room) {
        if (peer.id !== client.id && !peer.isDestroyed()) {
          setTimeout(() => {
            if (!peer.isDestroyed()) {
              peer.receive({
                type: "peer_joined",
                peer: newPeer,
              });
            }
          }, latencyMs + Math.random() * 12);
        }
      }
    }, latencyMs);
  }

  /**
   * Disconnects a client and notifies peers.
   */
  leave(client: SimulatedHubClient, latencyMs = 20) {
    const code = sanitizeRoomCode(client.roomCode);
    const room = this.rooms.get(code);
    if (!room) return;

    room.delete(client);
    if (!client.isDestroyed()) {
      client.setStatus("disconnected");
    }

    if (room.size === 0) {
      this.rooms.delete(code);
    } else {
      for (const peer of room) {
        if (!peer.isDestroyed()) {
          setTimeout(() => {
            if (!peer.isDestroyed()) {
              peer.receive({
                type: "peer_left",
                peerId: client.id,
              });
            }
          }, latencyMs);
        }
      }
    }
  }

  /**
   * Broadcasts a message to all other clients in the same room.
   */
  broadcast(sender: SimulatedHubClient, message: Record<string, unknown>, latencyMs = 35) {
    const code = sanitizeRoomCode(sender.roomCode);
    const room = this.rooms.get(code);
    if (!room) return;

    for (const peer of room) {
      if (peer.id !== sender.id && !peer.isDestroyed()) {
        const jitter = Math.random() * 16;
        setTimeout(() => {
          if (!peer.isDestroyed()) {
            peer.receive(message);
          }
        }, latencyMs + jitter);
      }
    }
  }

  /**
   * Clears all rooms and registered clients. Ideal for test teardown.
   */
  reset() {
    this.rooms.clear();
  }

  /**
   * Returns list of currently active room codes.
   */
  getActiveRoomCodes(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Returns number of active peers in the specified room.
   */
  getRoomPeerCount(code: string): number {
    return this.rooms.get(sanitizeRoomCode(code))?.size ?? 0;
  }
}

/**
 * Creates an isolated in-memory edge relay hub.
 */
export function createSimulatedRelayHub(): SimulatedEdgeRelayHub {
  return new SimulatedEdgeRelayHub();
}

/**
 * Shared default hub for local mock development and playground usage.
 */
export const defaultSimulatedHub = new SimulatedEdgeRelayHub();

export interface SimulatedRelayTransportOptions {
  id: string;
  name: string;
  roomCode: string;
  isHost: boolean;
  latencyMs?: number;
  hub?: SimulatedEdgeRelayHub;
}

/**
 * Simulated in-memory transport implementation.
 */
export class SimulatedRelayTransport implements RelayTransport {
  private client: SimulatedHubClient;
  private messageListeners = new Set<(data: unknown) => void>();
  private statusListeners = new Set<(status: RelayConnectionStatus, error?: string) => void>();
  private latencyMs: number;
  private hub: SimulatedEdgeRelayHub;
  private isDestroyedFlag = false;

  constructor(
    optionsOrId: SimulatedRelayTransportOptions | string,
    name?: string,
    roomCode?: string,
    isHost?: boolean,
    latencyMs?: number,
  ) {
    const options: SimulatedRelayTransportOptions =
      typeof optionsOrId === "string"
        ? {
            id: optionsOrId,
            name: name ?? "Player",
            roomCode: roomCode ?? "XK89",
            isHost: isHost ?? true,
            latencyMs: latencyMs ?? 35,
          }
        : optionsOrId;

    this.latencyMs = options.latencyMs ?? 35;
    this.hub = options.hub ?? defaultSimulatedHub;

    this.client = {
      id: options.id,
      name: options.name,
      roomCode: options.roomCode,
      isHost: options.isHost,
      receive: (msg) => {
        if (!this.isDestroyedFlag) {
          this.messageListeners.forEach((l) => l(msg));
        }
      },
      setStatus: (status, error) => {
        if (!this.isDestroyedFlag) {
          this.statusListeners.forEach((l) => l(status, error));
        }
      },
      isDestroyed: () => this.isDestroyedFlag,
    };
  }

  connect() {
    if (this.isDestroyedFlag) return;
    this.statusListeners.forEach((l) => l("connecting"));
    this.hub.join(this.client, this.latencyMs);
  }

  disconnect() {
    this.hub.leave(this.client, this.latencyMs);
  }

  send(msg: Record<string, unknown>) {
    if (this.isDestroyedFlag) return;

    // Simulate instant ping/pong loop with round-trip latency
    if (msg.type === "ping") {
      setTimeout(() => {
        if (!this.isDestroyedFlag) {
          this.messageListeners.forEach((l) =>
            l({
              type: "pong",
              sentAt: msg.sentAt,
            }),
          );
        }
      }, this.latencyMs * 2);
      return;
    }

    this.hub.broadcast(this.client, msg, this.latencyMs);
  }

  onMessage(handler: (data: unknown) => void): () => void {
    this.messageListeners.add(handler);
    return () => {
      this.messageListeners.delete(handler);
    };
  }

  onStatusChange(handler: (status: RelayConnectionStatus, error?: string) => void): () => void {
    this.statusListeners.add(handler);
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  destroy() {
    this.disconnect();
    this.isDestroyedFlag = true;
    this.messageListeners.clear();
    this.statusListeners.clear();
  }
}
