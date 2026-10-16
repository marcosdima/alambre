import type { RelayConnectionStatus, RelayTransport } from "../types";
import { sanitizeRoomCode } from "../code";

export interface WebSocketRelayTransportOptions {
  url: string;
  id: string;
  name: string;
  roomCode: string;
  isHost: boolean;
  autoReconnect?: boolean;
  initialRetryDelayMs?: number;
  maxRetryDelayMs?: number;
  backoffFactor?: number;
  webSocketFactory?: (url: string) => WebSocket;
}

/**
 * Universal WebSocket transport implementation.
 *
 * Designed for edge relays (Cloudflare Durable Objects, PartyKit, Fly.io, custom WS servers).
 * Features:
 * - Exponential backoff with jitter on dropped connections.
 * - Intentional disconnect detection (prevents unwanted reconnect loops).
 * - Proper listener detaching to eliminate zombie sockets.
 */
export class WebSocketRelayTransport implements RelayTransport {
  private ws: WebSocket | null = null;
  private url: string;
  private id: string;
  private name: string;
  private roomCode: string;
  private isHost: boolean;
  private autoReconnect: boolean;
  private initialRetryDelayMs: number;
  private maxRetryDelayMs: number;
  private backoffFactor: number;
  private webSocketFactory?: (url: string) => WebSocket;

  private messageListeners = new Set<(data: unknown) => void>();
  private statusListeners = new Set<(status: RelayConnectionStatus, error?: string) => void>();

  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private isDestroyedFlag = false;
  private isExplicitlyDisconnected = false;

  constructor(options: WebSocketRelayTransportOptions) {
    this.url = options.url;
    this.id = options.id;
    this.name = options.name;
    this.roomCode = sanitizeRoomCode(options.roomCode);
    this.isHost = options.isHost;
    this.autoReconnect = options.autoReconnect ?? true;
    this.initialRetryDelayMs = options.initialRetryDelayMs ?? 1000;
    this.maxRetryDelayMs = options.maxRetryDelayMs ?? 15000;
    this.backoffFactor = options.backoffFactor ?? 1.5;
    this.webSocketFactory = options.webSocketFactory;
  }

  connect() {
    if (this.isDestroyedFlag) return;
    this.isExplicitlyDisconnected = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Teardown any existing socket before opening a new one
    this.teardownSocket();

    this.notifyStatus("connecting");

    try {
      const fullUrl = this.buildUrl();

      if (this.webSocketFactory) {
        this.ws = this.webSocketFactory(fullUrl);
      } else if (typeof globalThis !== "undefined" && typeof globalThis.WebSocket !== "undefined") {
        this.ws = new globalThis.WebSocket(fullUrl);
      } else {
        throw new Error("No WebSocket implementation found in current environment");
      }

      this.ws.onopen = () => {
        if (this.isDestroyedFlag || this.isExplicitlyDisconnected) {
          this.teardownSocket();
          return;
        }

        this.reconnectAttempts = 0;
        this.notifyStatus("connected");

        // Send room join handshake packet
        this.send({
          type: "join",
          id: this.id,
          name: this.name,
          roomCode: this.roomCode,
          isHost: this.isHost,
        });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        if (this.isDestroyedFlag) return;
        try {
          const parsed = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          this.notifyMessage(parsed);
        } catch {
          this.notifyMessage(event.data);
        }
      };

      this.ws.onerror = (_event: Event) => {
        if (this.isDestroyedFlag || this.isExplicitlyDisconnected) return;
        this.notifyStatus("error", "WebSocket connection error");
      };

      this.ws.onclose = () => {
        if (this.isDestroyedFlag) return;

        if (this.isExplicitlyDisconnected) {
          this.notifyStatus("disconnected");
          return;
        }

        this.notifyStatus("disconnected");

        if (this.autoReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      this.notifyStatus("error", err instanceof Error ? err.message : "Failed to initialize WebSocket");
      if (this.autoReconnect && !this.isExplicitlyDisconnected) {
        this.scheduleReconnect();
      }
    }
  }

  disconnect() {
    this.isExplicitlyDisconnected = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.teardownSocket();
    this.notifyStatus("disconnected");
  }

  send(msg: Record<string, unknown>) {
    if (this.isDestroyedFlag || !this.ws) return;
    if (this.ws.readyState === 1 /* WebSocket.OPEN */) {
      this.ws.send(JSON.stringify(msg));
    }
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
    this.isDestroyedFlag = true;
    this.disconnect();
    this.messageListeners.clear();
    this.statusListeners.clear();
  }

  private buildUrl(): string {
    const encodedRoom = encodeURIComponent(this.roomCode);
    const encodedId = encodeURIComponent(this.id);
    const encodedName = encodeURIComponent(this.name);
    const cleanUrl = this.url.replace(/\/+$/, "");

    if (cleanUrl.includes("?")) {
      return `${cleanUrl}&room=${encodedRoom}&id=${encodedId}&name=${encodedName}`;
    }
    return `${cleanUrl}/${encodedRoom}?id=${encodedId}&name=${encodedName}`;
  }

  private teardownSocket() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch {
        // Ignore close errors on dead sockets
      }
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyedFlag || this.isExplicitlyDisconnected) return;

    this.notifyStatus("reconnecting");
    const attempt = this.reconnectAttempts++;
    const baseDelay = Math.min(
      this.maxRetryDelayMs,
      this.initialRetryDelayMs * Math.pow(this.backoffFactor, attempt),
    );
    // Add +/- 20% jitter
    const jitter = 1 + (Math.random() * 0.4 - 0.2);
    const delay = Math.round(baseDelay * jitter);

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isDestroyedFlag && !this.isExplicitlyDisconnected) {
        this.connect();
      }
    }, delay);
  }

  private notifyStatus(status: RelayConnectionStatus, error?: string) {
    this.statusListeners.forEach((l) => l(status, error));
  }

  private notifyMessage(msg: unknown) {
    this.messageListeners.forEach((l) => l(msg));
  }
}
