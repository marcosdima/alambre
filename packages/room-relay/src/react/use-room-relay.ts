import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type {
  DefaultRelayEvents,
  IRoomRelayClient,
  RoomRelayOptions,
  RoomRelayReturn,
  RoomRelayState,
} from "../types";
import { createRoomRelay } from "../client";

export type UseRoomRelayInput<TEvents extends DefaultRelayEvents = DefaultRelayEvents> =
  | RoomRelayOptions<TEvents>
  | { client: IRoomRelayClient<TEvents> };

function isClientOption<TEvents extends DefaultRelayEvents>(
  input: UseRoomRelayInput<TEvents>,
): input is { client: IRoomRelayClient<TEvents> } {
  return Boolean(
    input &&
      "client" in input &&
      input.client &&
      typeof (input.client as any).subscribe === "function",
  );
}

/**
 * Universal React hook for headless ephemeral room relay.
 *
 * Backed by useSyncExternalStore for tearing-free reactive rendering.
 *
 * @example
 * ```tsx
 * const relay = useRoomRelay({
 *   roomCode: "XK89",
 *   playerName: "Alice",
 *   mode: "simulated",
 * });
 *
 * // Send a typed message
 * relay.send("CARD_PLAYED", { cardId: "ace_spades" });
 * ```
 */
export function useRoomRelay<TEvents extends DefaultRelayEvents = DefaultRelayEvents>(
  options: UseRoomRelayInput<TEvents> = {},
): RoomRelayReturn<TEvents> {
  const isExternalClient = isClientOption(options);

  // Maintain client instance in ref to prevent recreation across re-renders
  const clientRef = useRef<IRoomRelayClient<TEvents> | null>(null);

  if (!clientRef.current || (!isExternalClient && clientRef.current.isDestroyed())) {
    if (isExternalClient) {
      clientRef.current = options.client;
    } else {
      clientRef.current = createRoomRelay<TEvents>(options);
    }
  }

  const client = clientRef.current;

  // Cleanup internal client on unmount
  useEffect(() => {
    return () => {
      if (!isExternalClient && clientRef.current) {
        clientRef.current.destroy();
        clientRef.current = null;
      }
    };
  }, [isExternalClient]);

  // Synchronize internal client when key options change dynamically
  useEffect(() => {
    if (isExternalClient || !client) return;

    const opts = options as RoomRelayOptions<TEvents>;
    if (opts.serverUrl) {
      client.setServerUrl(opts.serverUrl);
    }
    if (opts.playerName) {
      client.setPlayerName(opts.playerName);
    }
    if (opts.mode) {
      client.setMode(opts.mode);
    }
  }, [
    isExternalClient,
    client,
    !isExternalClient && (options as RoomRelayOptions<TEvents>).serverUrl,
    !isExternalClient && (options as RoomRelayOptions<TEvents>).playerName,
    !isExternalClient && (options as RoomRelayOptions<TEvents>).mode,
  ]);

  // Subscribe to external store
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return client.subscribe(onStoreChange);
    },
    [client],
  );

  const getSnapshot = useCallback(() => {
    return client.getState();
  }, [client]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(
    () => ({
      ...state,
      join: (code: string) => client.join(code),
      create: (opts?: { length?: number; roomCode?: string }) => client.create(opts),
      leave: () => client.leave(),
      connect: () => client.connect(),
      disconnect: () => client.disconnect(),
      send: (type: any, payload?: any) => client.send(type, payload),
      joinRoom: (code: string) => client.joinRoom(code),
      createRoom: (length?: number) => client.createRoom(length),
      setPlayerName: (name: string) => client.setPlayerName(name),
      setServerUrl: (url: string) => client.setServerUrl(url),
      setMode: (mode) => client.setMode(mode),
      setSimulatedLatency: (ms: number) => client.setSimulatedLatency(ms),
      clearHistory: () => client.clearHistory(),
      on: (type, handler) => client.on(type, handler),
      onMessage: (handler) => client.onMessage(handler),
      client,
    }),
    [state, client],
  );
}

/**
 * Subscribes to a specific slice of the room relay state to prevent unnecessary re-renders.
 *
 * @example
 * ```tsx
 * const latency = useRoomRelaySelector(client, state => state.latency);
 * ```
 */
export function useRoomRelaySelector<
  TSelected,
  TEvents extends DefaultRelayEvents = DefaultRelayEvents,
>(
  client: IRoomRelayClient<TEvents>,
  selector: (state: RoomRelayState) => TSelected,
): TSelected {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return client.subscribe(onStoreChange);
    },
    [client],
  );

  const getSnapshot = useCallback(() => {
    return selector(client.getState());
  }, [client, selector]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
