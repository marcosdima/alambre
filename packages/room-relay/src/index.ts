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
} from "./types";

// Room Code Utilities
export {
  ROOM_CODE_ALPHABET,
  generateRoomCode,
  sanitizeRoomCode,
} from "./code";

// Transports
export {
  SimulatedEdgeRelayHub,
  SimulatedRelayTransport,
  createSimulatedRelayHub,
  defaultSimulatedHub,
} from "./transports/simulated";
export type {
  SimulatedHubClient,
  SimulatedRelayTransportOptions,
} from "./transports/simulated";

export {
  WebSocketRelayTransport,
} from "./transports/websocket";
export type {
  WebSocketRelayTransportOptions,
} from "./transports/websocket";

// Headless Core Client
export {
  RoomRelayClient,
  createRoomRelay,
} from "./client";

// React Hooks
export {
  useRoomRelay,
  useRoomRelaySelector,
} from "./react/use-room-relay";
export type {
  UseRoomRelayInput,
} from "./react/use-room-relay";
