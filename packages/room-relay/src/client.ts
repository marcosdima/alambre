import type {
  DefaultRelayEvents,
  IRoomRelayClient,
  RelayMessage,
  RelayPeer,
  RelayTransport,
  RelayTransportMode,
  RoomRelayOptions,
  RoomRelayState,
} from "./types";
import { generateRoomCode, sanitizeRoomCode } from "./code";
import {
  SimulatedEdgeRelayHub,
  SimulatedRelayTransport,
  defaultSimulatedHub,
} from "./transports/simulated";
import { WebSocketRelayTransport } from "./transports/websocket";

export class RoomRelayClient<TEvents extends DefaultRelayEvents = DefaultRelayEvents>
  implements IRoomRelayClient<TEvents>
{
  private state: RoomRelayState;
  private options: RoomRelayOptions<TEvents>;
  private transport: RelayTransport | null = null;
  private unsubMessage: (() => void) | null = null;
  private unsubStatus: (() => void) | null = null;

  private listeners = new Set<() => void>();
  private eventListeners = new Map<string, Set<(payload: any, message: RelayMessage<any, any>) => void>>();
  private universalMessageListeners = new Set<(msg: RelayMessage<string, unknown>) => void>();

  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private watchdogTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastPingSentAt = 0;
  private isDestroyedFlag = false;

  constructor(options: RoomRelayOptions<TEvents> = {}) {
    this.options = {
      serverUrl: "wss://relay.alambre.party/room",
      autoReconnect: true,
      pingIntervalMs: 4000,
      watchdogTimeoutMs: 8000,
      simulatedLatencyMs: 35,
      maxHistoryLength: 50,
      ...options,
    };

    const initialRoomCode = sanitizeRoomCode(options.roomCode || "XK89");
    const initialPlayerId = options.playerId || `p_${Math.random().toString(36).substring(2, 8)}`;

    this.state = {
      status: "disconnected",
      mode: options.mode || "simulated",
      roomCode: initialRoomCode,
      playerId: initialPlayerId,
      playerName: options.playerName || "Player",
      isHost: options.isHost ?? true,
      peers: [],
      latency: 0,
      history: [],
    };

    if (options.initialEvents) {
      for (const [evt, handler] of Object.entries(options.initialEvents)) {
        if (handler) {
          this.on(evt as keyof TEvents, handler as any);
        }
      }
    }

    if (options.autoConnect) {
      this.connect();
    }
  }

  getState(): RoomRelayState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  connect(): void {
    if (this.isDestroyedFlag) return;

    this.initTransport();
    this.transport?.connect();
    this.startHeartbeat();
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.transport) {
      this.transport.disconnect();
    }
    this.updateState({
      status: "disconnected",
      peers: [],
      latency: 0,
    });
  }

  send<K extends keyof TEvents>(type: K, payload: TEvents[K]): void;
  send(type: string, payload: unknown): void;
  send(type: any, payload: any): void {
    if (this.isDestroyedFlag || !this.transport || this.state.status !== "connected") {
      return;
    }

    const now = Date.now();
    const message: RelayMessage<string, unknown> = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      from: this.state.playerId,
      senderName: this.state.playerName,
      type: String(type),
      payload,
      timestamp: now,
    };

    // Forward through transport
    this.transport.send(message as unknown as Record<string, unknown>);

    // Record in local history for optimistic snappy UI
    this.recordHistory(message);

    // Also dispatch to local listeners
    this.dispatchLocalMessage(message);
  }

  joinRoom(code: string): void {
    const cleanCode = sanitizeRoomCode(code);
    if (!cleanCode) return;

    const wasConnected = this.state.status === "connected" || this.state.status === "connecting";
    this.disconnect();

    this.updateState({
      roomCode: cleanCode,
      isHost: false,
    });

    if (wasConnected || this.options.autoConnect) {
      this.connect();
    }
  }

  createRoom(length = 4): string {
    const newCode = generateRoomCode(length);
    const wasConnected = this.state.status === "connected" || this.state.status === "connecting";
    this.disconnect();

    this.updateState({
      roomCode: newCode,
      isHost: true,
    });

    if (wasConnected || this.options.autoConnect) {
      this.connect();
    }

    return newCode;
  }

  setPlayerName(name: string): void {
    this.updateState({ playerName: name });
  }

  setMode(mode: RelayTransportMode): void {
    if (this.state.mode === mode) return;

    const wasConnected = this.state.status === "connected" || this.state.status === "connecting";
    this.disconnect();

    this.updateState({ mode });

    if (wasConnected || this.options.autoConnect) {
      this.connect();
    }
  }

  clearHistory(): void {
    this.updateState({ history: [] });
  }

  on<K extends keyof TEvents>(
    type: K,
    handler: (payload: TEvents[K], message: RelayMessage<Extract<K, string>, TEvents[K]>) => void,
  ): () => void {
    const key = String(type);
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }
    const set = this.eventListeners.get(key)!;
    set.add(handler);

    return () => {
      set.delete(handler);
      if (set.size === 0) {
        this.eventListeners.delete(key);
      }
    };
  }

  onMessage(handler: (message: RelayMessage<string, unknown>) => void): () => void {
    this.universalMessageListeners.add(handler);
    return () => {
      this.universalMessageListeners.delete(handler);
    };
  }

  isDestroyed(): boolean {
    return this.isDestroyedFlag;
  }

  destroy(): void {
    this.isDestroyedFlag = true;
    this.stopHeartbeat();
    this.teardownTransport();
    this.listeners.clear();
    this.eventListeners.clear();
    this.universalMessageListeners.clear();
  }

  private initTransport(): void {
    this.teardownTransport();

    const { mode, roomCode, playerId, playerName, isHost } = this.state;

    if (mode === "simulated") {
      this.transport = new SimulatedRelayTransport({
        id: playerId,
        name: playerName,
        roomCode,
        isHost,
        latencyMs: this.options.simulatedLatencyMs ?? 35,
        hub: (this.options.simulatedHub as SimulatedEdgeRelayHub) ?? defaultSimulatedHub,
      });
    } else {
      this.transport = new WebSocketRelayTransport({
        url: this.options.serverUrl ?? "wss://relay.alambre.party/room",
        id: playerId,
        name: playerName,
        roomCode,
        isHost,
        autoReconnect: this.options.autoReconnect ?? true,
        webSocketFactory: this.options.webSocketFactory,
      });
    }

    this.unsubStatus = this.transport.onStatusChange((status, error) => {
      this.updateState({ status, error });
    });

    this.unsubMessage = this.transport.onMessage((rawMsg) => {
      this.handleIncomingRaw(rawMsg);
    });
  }

  private teardownTransport(): void {
    if (this.unsubMessage) {
      this.unsubMessage();
      this.unsubMessage = null;
    }
    if (this.unsubStatus) {
      this.unsubStatus();
      this.unsubStatus = null;
    }
    if (this.transport) {
      this.transport.destroy();
      this.transport = null;
    }
  }

  private handleIncomingRaw(raw: unknown): void {
    if (!raw || typeof raw !== "object") return;
    const msg = raw as Record<string, unknown>;
    const type = msg.type as string;

    // 1. Heartbeat Pong
    if (type === "pong" && typeof msg.sentAt === "number") {
      this.clearWatchdog();
      const rtt = Math.max(1, Math.round(Date.now() - msg.sentAt));
      this.updateState({ latency: rtt });
      return;
    }

    // 2. Room Joined Handshake
    if (type === "room_joined" && Array.isArray(msg.peers)) {
      this.updateState({ peers: msg.peers as RelayPeer[] });
      return;
    }

    // 3. Peer Joined
    if (type === "peer_joined" && msg.peer) {
      const peer = msg.peer as RelayPeer;
      const filtered = this.state.peers.filter((p) => p.id !== peer.id);
      const systemMsg: RelayMessage<string, unknown> = {
        id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        from: "system",
        senderName: "System",
        type: "PEER_JOINED",
        payload: { name: peer.name, id: peer.id, isHost: peer.isHost },
        timestamp: Date.now(),
      };

      this.recordHistory(systemMsg);
      this.updateState({
        peers: [...filtered, peer],
      });
      return;
    }

    // 4. Peer Left
    if (type === "peer_left" && typeof msg.peerId === "string") {
      const peerId = msg.peerId;
      const leavingPeer = this.state.peers.find((p) => p.id === peerId);
      const filtered = this.state.peers.filter((p) => p.id !== peerId);
      const systemMsg: RelayMessage<string, unknown> = {
        id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        from: "system",
        senderName: "System",
        type: "PEER_LEFT",
        payload: { name: leavingPeer?.name ?? "Player", id: peerId },
        timestamp: Date.now(),
      };

      this.recordHistory(systemMsg);
      this.updateState({
        peers: filtered,
      });
      return;
    }

    // 5. Standard Application Message
    if (typeof type === "string") {
      const from = (msg.from as string) || "unknown";
      // Ignore reflection echo of messages sent by ourselves
      if (from === this.state.playerId) {
        return;
      }

      const now = Date.now();
      const sentTime = typeof msg.timestamp === "number" ? msg.timestamp : now;
      const incoming: RelayMessage<string, unknown> = {
        id: (msg.id as string) || `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
        from,
        senderName: (msg.senderName as string) || "Peer",
        type,
        payload: msg.payload,
        timestamp: sentTime,
        latencyMs: Math.max(0, now - sentTime),
      };

      this.recordHistory(incoming);
      this.dispatchLocalMessage(incoming);
    }
  }

  private dispatchLocalMessage(msg: RelayMessage<string, unknown>): void {
    const handlers = this.eventListeners.get(msg.type);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(msg.payload, msg as any);
        } catch (err) {
          console.error(`Error in room-relay listener for "${msg.type}":`, err);
        }
      });
    }

    this.universalMessageListeners.forEach((h) => {
      try {
        h(msg);
      } catch (err) {
        console.error("Error in room-relay universal message listener:", err);
      }
    });
  }

  private recordHistory(msg: RelayMessage<string, unknown>): void {
    const max = this.options.maxHistoryLength ?? 50;
    if (max <= 0) return;

    this.updateState({
      history: [msg, ...this.state.history.slice(0, max - 1)],
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    const interval = this.options.pingIntervalMs ?? 4000;

    this.pingInterval = setInterval(() => {
      if (this.state.status === "connected" && this.transport) {
        this.lastPingSentAt = Date.now();
        this.transport.send({
          type: "ping",
          sentAt: this.lastPingSentAt,
        });

        this.scheduleWatchdog();
      }
    }, interval);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.clearWatchdog();
  }

  private scheduleWatchdog(): void {
    this.clearWatchdog();
    const timeout = this.options.watchdogTimeoutMs ?? (this.options.pingIntervalMs ?? 4000) * 2;

    this.watchdogTimeout = setTimeout(() => {
      if (this.state.status === "connected") {
        // Socket is unresponsive (half-open drop)
        this.updateState({
          error: "Heartbeat watchdog timeout: connection unresponsive",
        });
        // Force reconnect
        this.connect();
      }
    }, timeout);
  }

  private clearWatchdog(): void {
    if (this.watchdogTimeout) {
      clearTimeout(this.watchdogTimeout);
      this.watchdogTimeout = null;
    }
  }

  private updateState(partial: Partial<RoomRelayState>): void {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

/**
 * Factory to create a headless RoomRelayClient.
 */
export function createRoomRelay<TEvents extends DefaultRelayEvents = DefaultRelayEvents>(
  options?: RoomRelayOptions<TEvents>,
): RoomRelayClient<TEvents> {
  return new RoomRelayClient<TEvents>(options);
}
