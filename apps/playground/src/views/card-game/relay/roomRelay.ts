/* global WebSocket */
import { useSyncExternalStore, useRef, useEffect, useCallback, useMemo } from 'react';
import type {
  RelayConnectionStatus,
  RelayMessage,
  RelayPeer,
  RelayTransportMode,
  RoomRelayOptions,
  RoomRelayState,
} from '../types';

// ============================================================================
// Transport Layer Interface
// ============================================================================

export interface RelayTransport {
  connect: () => void;
  disconnect: () => void;
  send: (msg: Record<string, unknown>) => void;
  onMessage: (handler: (data: unknown) => void) => void;
  onStatusChange: (handler: (status: RelayConnectionStatus, error?: string) => void) => void;
  destroy: () => void;
}

// ============================================================================
// In-Memory Simulated Edge Relay Hub (Global for local testing)
// ============================================================================

interface HubClient {
  id: string;
  name: string;
  isHost: boolean;
  roomCode: string;
  receive: (msg: Record<string, unknown>) => void;
  setStatus: (status: RelayConnectionStatus, error?: string) => void;
}

class SimulatedEdgeRelayHub {
  private rooms = new Map<string, Set<HubClient>>();

  join(client: HubClient, latencyMs = 35) {
    const code = client.roomCode.toUpperCase();
    if (!this.rooms.has(code)) {
      this.rooms.set(code, new Set());
    }
    const room = this.rooms.get(code)!;

    // Simulate edge connection handshake delay
    setTimeout(() => {
      room.add(client);
      client.setStatus('connected');

      // Send current peers to joining client
      const existingPeers: RelayPeer[] = Array.from(room)
        .filter((c) => c.id !== client.id)
        .map((c) => ({
          id: c.id,
          name: c.name,
          isHost: c.isHost,
          lastSeen: Date.now(),
        }));

      client.receive({
        type: 'room_joined',
        roomCode: code,
        peers: existingPeers,
      });

      // Broadcast new peer to everyone else in the room
      const newPeer: RelayPeer = {
        id: client.id,
        name: client.name,
        isHost: client.isHost,
        lastSeen: Date.now(),
      };

      for (const peer of room) {
        if (peer.id !== client.id) {
          setTimeout(() => {
            peer.receive({
              type: 'peer_joined',
              peer: newPeer,
            });
          }, latencyMs + Math.random() * 15);
        }
      }
    }, latencyMs);
  }

  leave(client: HubClient, latencyMs = 20) {
    const code = client.roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    room.delete(client);
    client.setStatus('disconnected');

    if (room.size === 0) {
      this.rooms.delete(code);
    } else {
      for (const peer of room) {
        setTimeout(() => {
          peer.receive({
            type: 'peer_left',
            peerId: client.id,
          });
        }, latencyMs);
      }
    }
  }

  broadcast(sender: HubClient, message: Record<string, unknown>, latencyMs = 35) {
    const code = sender.roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    for (const peer of room) {
      if (peer.id !== sender.id) {
        const jitter = Math.random() * 20;
        setTimeout(() => {
          peer.receive(message);
        }, latencyMs + jitter);
      }
    }
  }
}

const globalSimulatedHub = new SimulatedEdgeRelayHub();

// ============================================================================
// Simulated Transport Implementation
// ============================================================================

export class SimulatedRelayTransport implements RelayTransport {
  private client: HubClient;
  private messageHandler: ((data: unknown) => void) | null = null;
  private statusHandler: ((status: RelayConnectionStatus, error?: string) => void) | null = null;
  private latencyMs: number;

  constructor(
    id: string,
    name: string,
    roomCode: string,
    isHost: boolean,
    latencyMs = 35,
  ) {
    this.latencyMs = latencyMs;
    this.client = {
      id,
      name,
      roomCode,
      isHost,
      receive: (msg) => this.messageHandler?.(msg),
      setStatus: (status, error) => this.statusHandler?.(status, error),
    };
  }

  connect() {
    this.statusHandler?.('connecting');
    globalSimulatedHub.join(this.client, this.latencyMs);
  }

  disconnect() {
    globalSimulatedHub.leave(this.client, this.latencyMs);
  }

  send(msg: Record<string, unknown>) {
    // Handle ping natively in simulated loop
    if (msg.type === 'ping') {
      setTimeout(() => {
        this.messageHandler?.({
          type: 'pong',
          sentAt: msg.sentAt,
        });
      }, this.latencyMs * 2);
      return;
    }

    globalSimulatedHub.broadcast(this.client, msg, this.latencyMs);
  }

  onMessage(handler: (data: unknown) => void) {
    this.messageHandler = handler;
  }

  onStatusChange(handler: (status: RelayConnectionStatus, error?: string) => void) {
    this.statusHandler = handler;
  }

  destroy() {
    this.disconnect();
    this.messageHandler = null;
    this.statusHandler = null;
  }
}

// ============================================================================
// WebSocket Transport Implementation (Native WebSocket / PartyKit / Cloudflare DO)
// ============================================================================

export class WebSocketRelayTransport implements RelayTransport {
  private ws: WebSocket | null = null;
  private url: string;
  private id: string;
  private name: string;
  private roomCode: string;
  private isHost: boolean;
  private messageHandler: ((data: unknown) => void) | null = null;
  private statusHandler: ((status: RelayConnectionStatus, error?: string) => void) | null = null;
  private autoReconnect: boolean;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;

  constructor(
    url: string,
    id: string,
    name: string,
    roomCode: string,
    isHost: boolean,
    autoReconnect = true,
  ) {
    this.url = url;
    this.id = id;
    this.name = name;
    this.roomCode = roomCode;
    this.isHost = isHost;
    this.autoReconnect = autoReconnect;
  }

  connect() {
    if (this.isDestroyed) return;
    this.statusHandler?.('connecting');

    try {
      // Standard Edge Room URL schema: ws://host/room/{code}?id={id}&name={name}&host={isHost}
      const fullUrl = this.url.includes('?')
        ? `${this.url}&room=${encodeURIComponent(this.roomCode)}&id=${encodeURIComponent(this.id)}&name=${encodeURIComponent(this.name)}`
        : `${this.url}/${encodeURIComponent(this.roomCode)}?id=${encodeURIComponent(this.id)}&name=${encodeURIComponent(this.name)}`;

      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        this.statusHandler?.('connected');
        this.send({
          type: 'join',
          id: this.id,
          name: this.name,
          roomCode: this.roomCode,
          isHost: this.isHost,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string);
          this.messageHandler?.(parsed);
        } catch {
          this.messageHandler?.(event.data);
        }
      };

      this.ws.onerror = (_err) => {
        const errorMsg = 'WebSocket connection error';
        this.statusHandler?.('error', errorMsg);
      };

      this.ws.onclose = () => {
        this.statusHandler?.('disconnected');
        if (this.autoReconnect && !this.isDestroyed) {
          this.statusHandler?.('reconnecting');
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };
    } catch (err) {
      this.statusHandler?.('error', err instanceof Error ? err.message : 'Failed to connect');
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.statusHandler?.('disconnected');
  }

  send(msg: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  onMessage(handler: (data: unknown) => void) {
    this.messageHandler = handler;
  }

  onStatusChange(handler: (status: RelayConnectionStatus, error?: string) => void) {
    this.statusHandler = handler;
  }

  destroy() {
    this.isDestroyed = true;
    this.disconnect();
    this.messageHandler = null;
    this.statusHandler = null;
  }
}

// ============================================================================
// Room Code Generator
// ============================================================================

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous characters (I, 1, O, 0)
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================================
// Headless Room Relay Hook
// ============================================================================

export function useRoomRelay(options: RoomRelayOptions = {}) {
  const {
    roomCode: initialRoomCode = 'XK89',
    playerName: initialPlayerName = 'Player 1',
    isHost: initialIsHost = true,
    mode: initialMode = 'simulated',
    serverUrl = 'wss://relay.alambre.party/room',
    autoReconnect = true,
    pingIntervalMs = 4000,
    simulatedLatencyMs = 35,
  } = options;

  const playerIdRef = useRef<string>(
    `p_${Math.random().toString(36).substring(2, 8)}`,
  );

  const stateRef = useRef<RoomRelayState>({
    status: 'disconnected',
    mode: initialMode,
    roomCode: initialRoomCode,
    playerId: playerIdRef.current,
    playerName: initialPlayerName,
    isHost: initialIsHost,
    peers: [],
    latency: 0,
    history: [],
  });

  const listenersRef = useRef<Set<() => void>>(new Set());
  const transportRef = useRef<RelayTransport | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = useCallback(() => {
    listenersRef.current.forEach((l) => l());
  }, []);

  const setState = useCallback(
    (updater: Partial<RoomRelayState> | ((prev: RoomRelayState) => Partial<RoomRelayState>)) => {
      const prev = stateRef.current;
      const next = typeof updater === 'function' ? { ...prev, ...updater(prev) } : { ...prev, ...updater };
      stateRef.current = next;
      notify();
    },
    [notify],
  );

  // Setup transport
  const initTransport = useCallback(() => {
    if (transportRef.current) {
      transportRef.current.destroy();
      transportRef.current = null;
    }

    const { mode, roomCode, playerName, isHost } = stateRef.current;
    const playerId = playerIdRef.current;

    let transport: RelayTransport;
    if (mode === 'simulated') {
      transport = new SimulatedRelayTransport(
        playerId,
        playerName,
        roomCode,
        isHost,
        simulatedLatencyMs,
      );
    } else {
      transport = new WebSocketRelayTransport(
        serverUrl,
        playerId,
        playerName,
        roomCode,
        isHost,
        autoReconnect,
      );
    }

    transport.onStatusChange((status, error) => {
      setState({ status, error });
    });

    transport.onMessage((rawMsg: unknown) => {
      const msg = rawMsg as Record<string, unknown>;
      if (!msg || typeof msg !== 'object') return;

      const type = msg.type as string;

      if (type === 'pong' && typeof msg.sentAt === 'number') {
        const rtt = Math.round(Date.now() - msg.sentAt);
        setState({ latency: rtt });
        return;
      }

      if (type === 'room_joined' && Array.isArray(msg.peers)) {
        setState({ peers: msg.peers as RelayPeer[] });
        return;
      }

      if (type === 'peer_joined' && msg.peer) {
        const peer = msg.peer as RelayPeer;
        setState((prev) => ({
          peers: [...prev.peers.filter((p) => p.id !== peer.id), peer],
          history: [
            {
              id: `sys_${Date.now()}_${Math.random()}`,
              from: 'system',
              senderName: 'System',
              type: 'PEER_JOINED',
              payload: { name: peer.name },
              timestamp: Date.now(),
            },
            ...prev.history.slice(0, 49),
          ],
        }));
        return;
      }

      if (type === 'peer_left' && typeof msg.peerId === 'string') {
        const peerId = msg.peerId;
        setState((prev) => {
          const peer = prev.peers.find((p) => p.id === peerId);
          return {
            peers: prev.peers.filter((p) => p.id !== peerId),
            history: [
              {
                id: `sys_${Date.now()}_${Math.random()}`,
                from: 'system',
                senderName: 'System',
                type: 'PEER_LEFT',
                payload: { name: peer?.name ?? 'Player' },
                timestamp: Date.now(),
              },
              ...prev.history.slice(0, 49),
            ],
          };
        });
        return;
      }

      // Normal application broadcast message
      if (typeof msg.type === 'string') {
        const incomingMsg: RelayMessage = {
          id: (msg.id as string) || `msg_${Date.now()}_${Math.random()}`,
          from: (msg.from as string) || 'unknown',
          senderName: (msg.senderName as string) || 'Peer',
          type: msg.type,
          payload: msg.payload,
          timestamp: (msg.timestamp as number) || Date.now(),
          latencyMs: typeof msg.timestamp === 'number' ? Math.max(0, Date.now() - msg.timestamp) : undefined,
        };

        setState((prev) => ({
          history: [incomingMsg, ...prev.history.slice(0, 49)],
        }));
      }
    });

    transportRef.current = transport;
    return transport;
  }, [autoReconnect, serverUrl, setState, simulatedLatencyMs]);

  // Heartbeat ping loop
  const startHeartbeat = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    pingIntervalRef.current = setInterval(() => {
      if (stateRef.current.status === 'connected' && transportRef.current) {
        transportRef.current.send({
          type: 'ping',
          sentAt: Date.now(),
        });
      }
    }, pingIntervalMs);
  }, [pingIntervalMs]);

  // Connect action
  const connect = useCallback(() => {
    const transport = initTransport();
    transport.connect();
    startHeartbeat();
  }, [initTransport, startHeartbeat]);

  // Disconnect action
  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (transportRef.current) {
      transportRef.current.disconnect();
    }
    setState({ status: 'disconnected', peers: [] });
  }, [setState]);

  // Send action
  const send = useCallback(
    (type: string, payload?: unknown) => {
      if (!transportRef.current || stateRef.current.status !== 'connected') {
        return;
      }
      const now = Date.now();
      const message: RelayMessage = {
        id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
        from: playerIdRef.current,
        senderName: stateRef.current.playerName,
        type,
        payload,
        timestamp: now,
      };

      // Send to peers via transport
      transportRef.current.send(message as unknown as Record<string, unknown>);

      // Add to local history immediately for snappy response
      setState((prev) => ({
        history: [message, ...prev.history.slice(0, 49)],
      }));
    },
    [setState],
  );

  // Room Management
  const createRoom = useCallback(() => {
    const newCode = generateRoomCode();
    disconnect();
    setState({ roomCode: newCode, isHost: true });
    // Reconnect with new code
    setTimeout(() => {
      connect();
    }, 50);
    return newCode;
  }, [connect, disconnect, setState]);

  const joinRoom = useCallback(
    (code: string) => {
      disconnect();
      setState({ roomCode: code.toUpperCase().trim(), isHost: false });
      setTimeout(() => {
        connect();
      }, 50);
    },
    [connect, disconnect, setState],
  );

  const setPlayerName = useCallback(
    (name: string) => {
      setState({ playerName: name });
    },
    [setState],
  );

  const setMode = useCallback(
    (mode: RelayTransportMode) => {
      disconnect();
      setState({ mode });
      setTimeout(() => {
        connect();
      }, 50);
    },
    [connect, disconnect, setState],
  );

  const clearHistory = useCallback(() => {
    setState({ history: [] });
  }, [setState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (transportRef.current) transportRef.current.destroy();
    };
  }, []);

  // Sync with External Store for tearing-free reactive state
  const subscribe = useCallback((onStoreChange: () => void) => {
    listenersRef.current.add(onStoreChange);
    return () => {
      listenersRef.current.delete(onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => stateRef.current, []);

  const state = useSyncExternalStore(subscribe, getSnapshot);

  return useMemo(
    () => ({
      ...state,
      connect,
      disconnect,
      send,
      createRoom,
      joinRoom,
      setPlayerName,
      setMode,
      clearHistory,
    }),
    [
      state,
      connect,
      disconnect,
      send,
      createRoom,
      joinRoom,
      setPlayerName,
      setMode,
      clearHistory,
    ],
  );
}
