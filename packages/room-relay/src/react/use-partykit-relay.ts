import type {
  DefaultRelayEvents,
  IRoomRelayClient,
  RoomRelayOptions,
  RoomRelayReturn,
} from "../types";
import { createRoomRelay } from "../client";
import { useRoomRelay } from "./use-room-relay";
import { PartyKitRelayTransport } from "../transports/partykit";

export interface UsePartyKitRelayOptions<TEvents extends DefaultRelayEvents = DefaultRelayEvents>
  extends Omit<RoomRelayOptions<TEvents>, "mode" | "transport" | "serverUrl"> {
  /**
   * PartyKit host or URL (e.g. "localhost:1999" or "my-party.username.partykit.dev").
   * Automatically falls back to process.env.EXPO_PUBLIC_PARTYKIT_HOST or process.env.EXPO_PUBLIC_RELAY_URL.
   */
  host?: string;
  /**
   * PartyKit party name identifier.
   * @default "main"
   */
  party?: string;
}

/**
 * High-level React hook for ephemeral room synchronization using PartyKit edge servers.
 *
 * Automatically inspects process.env.EXPO_PUBLIC_PARTYKIT_HOST and creates a
 * compliant `PartyKitRelayTransport` adapter.
 *
 * @example
 * ```tsx
 * const relay = usePartyKitRelay({
 *   roomCode: "XK89",
 *   playerName: "Alice",
 * });
 * ```
 */
export function usePartyKitRelay<TEvents extends DefaultRelayEvents = DefaultRelayEvents>(
  options: UsePartyKitRelayOptions<TEvents> = {},
): RoomRelayReturn<TEvents> {
  const { host, party, ...rest } = options;

  return useRoomRelay<TEvents>({
    ...rest,
    mode: "custom",
    transport: (ctx) =>
      new PartyKitRelayTransport({
        host,
        party,
        roomCode: ctx.roomCode,
        id: ctx.id,
        name: ctx.name,
        isHost: ctx.isHost,
        password: ctx.password,
        autoReconnect: ctx.autoReconnect,
        webSocketFactory: ctx.webSocketFactory,
      }),
  });
}

/**
 * Headless factory creating a PartyKit-configured `RoomRelayClient`.
 */
export function createPartyKitRelay<TEvents extends DefaultRelayEvents = DefaultRelayEvents>(
  options: UsePartyKitRelayOptions<TEvents> = {},
): IRoomRelayClient<TEvents> {
  const { host, party, ...rest } = options;

  return createRoomRelay<TEvents>({
    ...rest,
    mode: "custom",
    transport: (ctx) =>
      new PartyKitRelayTransport({
        host,
        party,
        roomCode: ctx.roomCode,
        id: ctx.id,
        name: ctx.name,
        isHost: ctx.isHost,
        password: ctx.password,
        autoReconnect: ctx.autoReconnect,
        webSocketFactory: ctx.webSocketFactory,
      }),
  });
}
