/**
 * Connection status states of a relay transport.
 */
export type RelayConnectionStatus =
  | "idle"
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

/**
 * Representation of a connected peer in an ephemeral room.
 */
export interface RelayPeer {
  /**
   * Unique client ID.
   */
  id: string;
  /**
   * Display name of the peer.
   */
  name: string;
  /**
   * Whether this peer created the room or holds host privileges.
   */
  isHost: boolean;
  /**
   * Optional ping/RTT latency in milliseconds.
   */
  ping?: number;
  /**
   * Timestamp (epoch ms) when the peer was last observed.
   */
  lastSeen: number;
}

/**
 * Standard envelope for messages routed through the relay.
 */
export interface RelayMessage<TType extends string = string, TPayload = unknown> {
  /**
   * Unique message ID.
   */
  id: string;
  /**
   * Sender client ID.
   */
  from: string;
  /**
   * Sender display name.
   */
  senderName?: string;
  /**
   * Message event type identifier.
   */
  type: TType;
  /**
   * Message data payload.
   */
  payload: TPayload;
  /**
   * Timestamp (epoch ms) when the message was dispatched by the sender.
   */
  timestamp: number;
  /**
   * One-way transport transit latency in milliseconds (if clocks are roughly synchronized).
   */
  latencyMs?: number;
}

/**
 * Supported transport modes.
 */
export type RelayTransportMode = "simulated" | "websocket";

/**
 * Abstract transport interface decoupled from native modules or WebSocket implementations.
 */
export interface RelayTransport {
  /**
   * Initiates connection to the relay room.
   */
  connect(): void;
  /**
   * Gracefully closes the connection without auto-reconnecting.
   */
  disconnect(): void;
  /**
   * Sends a raw message payload to the relay.
   */
  send(msg: Record<string, unknown>): void;
  /**
   * Subscribes to incoming messages. Returns unsubscribe callback.
   */
  onMessage(handler: (data: unknown) => void): () => void;
  /**
   * Subscribes to connection status transitions. Returns unsubscribe callback.
   */
  onStatusChange(handler: (status: RelayConnectionStatus, error?: string) => void): () => void;
  /**
   * Destroys transport instance and permanently detaches all listeners.
   */
  destroy(): void;
}

/**
 * Default loose map for event types and payloads.
 */
export type DefaultRelayEvents = Record<string, unknown>;

/**
 * Configuration options for initializing a room relay client or hook.
 */
export interface RoomRelayOptions<TEvents extends DefaultRelayEvents = DefaultRelayEvents> {
  /**
   * Initial room code (e.g. "XK89"). Will be normalized/uppercased.
   * @default "XK89"
   */
  roomCode?: string;
  /**
   * Display name of the local player.
   * @default "Player"
   */
  playerName?: string;
  /**
   * Whether this player acts as host.
   * @default true
   */
  isHost?: boolean;
  /**
   * Optional custom player ID. If omitted, a random ID is generated.
   */
  playerId?: string;
  /**
   * Transport layer to use.
   * @default "simulated"
   */
  mode?: RelayTransportMode;
  /**
   * WebSocket server endpoint for "websocket" mode.
   * @default "wss://relay.alambre.party/room"
   */
  serverUrl?: string;
  /**
   * Whether to automatically connect upon creation.
   * @default false
   */
  autoConnect?: boolean;
  /**
   * Whether to automatically reconnect when WebSocket is abruptly dropped.
   * @default true
   */
  autoReconnect?: boolean;
  /**
   * Frequency in milliseconds for sending heartbeat pings.
   * @default 4000
   */
  pingIntervalMs?: number;
  /**
   * Watchdog timeout in milliseconds. If no pong arrives within this period,
   * the socket is assumed dead/half-open and reconnect is triggered.
   * @default 8000
   */
  watchdogTimeoutMs?: number;
  /**
   * Simulated network latency in milliseconds for "simulated" mode.
   * @default 35
   */
  simulatedLatencyMs?: number;
  /**
   * Custom simulated hub instance (useful for test isolation).
   */
  simulatedHub?: unknown;
  /**
   * Maximum message history retained in state. 0 disables history allocation.
   * @default 50
   */
  maxHistoryLength?: number;
  /**
   * Custom WebSocket constructor or factory for Node/Vitest environments.
   */
  webSocketFactory?: (url: string) => WebSocket;
  /**
   * Initial event handlers to attach immediately.
   */
  initialEvents?: Partial<{
    [K in keyof TEvents]: (payload: TEvents[K], message: RelayMessage<Extract<K, string>, TEvents[K]>) => void;
  }>;
}

/**
 * Snapshot state of the room relay.
 */
export interface RoomRelayState {
  status: RelayConnectionStatus;
  mode: RelayTransportMode;
  roomCode: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  peers: RelayPeer[];
  latency: number;
  /**
   * Round-trip time (RTT) heartbeat latency in milliseconds.
   */
  latencyMs: number;
  history: RelayMessage<string, unknown>[];
  error?: string;
}

/**
 * Action methods exported by the room relay client and hook.
 */
export interface RoomRelayActions<TEvents extends DefaultRelayEvents = DefaultRelayEvents> {
  join(roomCode: string): void;
  create(options?: { length?: number; roomCode?: string }): string;
  leave(): void;
  connect(): void;
  disconnect(): void;
  send<K extends keyof TEvents>(type: K, payload: TEvents[K]): void;
  send(type: string, payload: unknown): void;
  joinRoom(code: string): void;
  createRoom(length?: number): string;
  setPlayerName(name: string): void;
  setServerUrl(url: string): void;
  setMode(mode: RelayTransportMode): void;
  setSimulatedLatency(ms: number): void;
  clearHistory(): void;
  on<K extends keyof TEvents>(
    type: K,
    handler: (payload: TEvents[K], message: RelayMessage<Extract<K, string>, TEvents[K]>) => void,
  ): () => void;
  onMessage(handler: (message: RelayMessage<string, unknown>) => void): () => void;
}

/**
 * Public interface representing the headless RoomRelayClient.
 */
export interface IRoomRelayClient<TEvents extends DefaultRelayEvents = DefaultRelayEvents>
  extends RoomRelayActions<TEvents> {
  getState(): RoomRelayState;
  subscribe(listener: () => void): () => void;
  isDestroyed(): boolean;
  destroy(): void;
}

/**
 * Return signature of useRoomRelay React hook.
 */
export interface RoomRelayReturn<TEvents extends DefaultRelayEvents = DefaultRelayEvents>
  extends RoomRelayState,
    RoomRelayActions<TEvents> {
  /**
   * Direct access to the underlying headless client instance.
   */
  client: IRoomRelayClient<TEvents>;
}
