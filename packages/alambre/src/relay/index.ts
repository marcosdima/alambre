// Types
export type {
  DefaultRelayEvents,
  IRoomRelayClient,
  RelayConnectionStatus,
  RelayMessage,
  RelayPeer,
  RelayTransport,
  RelayTransportMode,
  RoomRelayActions,
  RoomRelayOptions,
  RoomRelayReturn,
  RoomRelayState,
  TransportContext,
} from './types';

// Room Code Utilities
export {
  ROOM_CODE_ALPHABET,
  generateRoomCode,
  sanitizeRoomCode,
} from './code';

// Transports
export {
  SimulatedEdgeRelayHub,
  SimulatedRelayTransport,
  createSimulatedRelayHub,
  defaultSimulatedHub,
} from './transports/simulated';
export type {
  SimulatedHubClient,
  SimulatedRelayTransportOptions,
} from './transports/simulated';

export {
  WebSocketRelayTransport,
  resolveRelayUrl,
} from './transports/websocket';
export type {
  WebSocketRelayTransportOptions,
  ResolveRelayUrlOptions,
} from './transports/websocket';

// Headless Core Client
export {
  RoomRelayClient,
  createRoomRelay,
} from './client';

// React Hooks
export {
  useRoomRelay,
  useRoomRelaySelector,
} from './react/use-room-relay';
export type {
  UseRoomRelayInput,
} from './react/use-room-relay';

// Deterministic Seeded PRNG & Shuffle
export {
  hashSeed,
  createSeededRng,
  shuffleWithSeed,
} from './prng';

// Authoritative Turn Engine
export {
  TURN_ENGINE_EVENTS,
  TurnEngineClient,
  createTurnEngine,
} from './turn-engine';
export type {
  TurnActionMeta,
  TurnReducer,
  TurnActionIntentPayload,
  TurnActionCommitPayload,
  TurnSyncRequestPayload,
  TurnSyncSnapshotPayload,
  TurnEngineState,
  TurnEngineOptions,
  ITurnEngineClient,
} from './turn-engine';

export {
  useTurnEngine,
} from './react/use-turn-engine';
export type {
  UseTurnEngineInput,
  UseTurnEngineReturn,
} from './react/use-turn-engine';

// PartyKit Transport & Hook
export {
  PartyKitRelayTransport,
  createPartyKitTransport,
  resolvePartyKitUrl,
  resolveDefaultPartyKitHost,
} from './transports/partykit';
export type {
  PartyKitRelayTransportOptions,
  ResolvePartyKitUrlOptions,
} from './transports/partykit';
export {
  usePartyKitRelay,
  createPartyKitRelay,
} from './react/use-partykit-relay';
export type {
  UsePartyKitRelayOptions,
} from './react/use-partykit-relay';


