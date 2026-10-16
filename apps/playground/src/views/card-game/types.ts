export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export interface PlayingCardData {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp?: boolean;
  isArriving?: boolean;
  dealOrigin?: { x: number; y: number; flip?: boolean };
  playTarget?: { x: number; y: number; rotation?: number };
}

export type RelayConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface RelayPeer {
  id: string;
  name: string;
  isHost: boolean;
  ping?: number;
  lastSeen: number;
}

export interface RelayMessage<T = unknown> {
  id: string;
  from: string;
  senderName?: string;
  type: string;
  payload: T;
  timestamp: number;
  latencyMs?: number;
}

export type RelayTransportMode = 'simulated' | 'websocket';

export interface RoomRelayOptions {
  roomCode?: string;
  playerName?: string;
  isHost?: boolean;
  mode?: RelayTransportMode;
  serverUrl?: string;
  autoReconnect?: boolean;
  pingIntervalMs?: number;
  simulatedLatencyMs?: number;
}

export interface RoomRelayState {
  status: RelayConnectionStatus;
  mode: RelayTransportMode;
  roomCode: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  peers: RelayPeer[];
  latency: number;
  history: RelayMessage[];
  error?: string;
}
