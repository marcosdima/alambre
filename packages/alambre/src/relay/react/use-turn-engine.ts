import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type {
  DefaultRelayEvents,
  IRoomRelayClient,
  RoomRelayState,
} from '../types';
import {
  createTurnEngine,
  type ITurnEngineClient,
  type TurnEngineOptions,
  type TurnEngineState,
} from '../turn-engine';

export type UseTurnEngineInput<
  TState,
  TAction,
  TEvents extends DefaultRelayEvents = DefaultRelayEvents,
> =
  | TurnEngineOptions<TState, TAction, TEvents>
  | { engine: ITurnEngineClient<TState, TAction, TEvents> };

function isEngineOption<
  TState,
  TAction,
  TEvents extends DefaultRelayEvents,
>(
  input: UseTurnEngineInput<TState, TAction, TEvents>,
): input is { engine: ITurnEngineClient<TState, TAction, TEvents> } {
  return Boolean(
    input &&
      'engine' in input &&
      input.engine &&
      typeof input.engine.subscribe === 'function',
  );
}

export interface StagedFlightPatch<TState> {
  id: string;
  patch: (state: TState) => TState;
  metadata?: Record<string, unknown>;
}

export interface UseTurnEngineReturn<
  TState,
  TAction,
  TEvents extends DefaultRelayEvents = DefaultRelayEvents,
> extends TurnEngineState<TState, TAction> {
  /** Dispatches an action (commits immediately on host; sends intent to host when called by a guest). */
  dispatch: (action: TAction) => boolean;
  /** Host-only: forces a state replacement and broadcasts an authoritative snapshot to all peers. */
  resetGameState: (nextState: TState, resetSeq?: boolean) => void;
  /** Host-only: broadcasts the current authoritative state snapshot to all peers. */
  syncSnapshot: () => void;
  /** Guest: requests the latest authoritative state snapshot from the host. */
  requestSync: () => void;
  /** Starts or restarts the turn countdown timer. */
  startTurnTimer: (durationMs?: number) => void;
  /** Stops the active turn countdown timer. */
  stopTurnTimer: () => void;
  /** Current state snapshot of the underlying room relay. */
  relayState: RoomRelayState;
  /** Underlying room relay client instance. */
  relay: IRoomRelayClient<TEvents>;
  /** Underlying turn engine client instance. */
  engine: ITurnEngineClient<TState, TAction, TEvents>;
  /**
   * Optimistically modified game state incorporating active in-flight patches.
   * Piles and UI components can consume `visualGameState` to immediately reflect departing items
   * during flight trajectories without causing ghost cards before authoritative commit.
   */
  visualGameState: TState;
  /** Currently active staged flight patches. */
  stagedFlights: StagedFlightPatch<TState>[];
  /**
   * Stages an optimistic patch during a flight animation.
   * Returns a cleanup function that cancels the patch if not committed.
   */
  stageFlight: (
    id: string,
    patch: (state: TState) => TState,
    metadata?: Record<string, unknown>,
  ) => () => void;
  /**
   * Atomically removes the staged flight patch and commits the authoritative action.
   */
  commitFlight: (id: string, action: TAction) => boolean;
  /**
   * Cancels an active staged flight patch without dispatching an action.
   */
  cancelFlight: (id: string) => void;
}

/**
 * React hook for host-authoritative turn-based state synchronization over `@some-alambre/room-relay`.
 * Backed by `useSyncExternalStore` for tearing-free updates.
 */
export function useTurnEngine<
  TState,
  TAction,
  TEvents extends DefaultRelayEvents = DefaultRelayEvents,
>(
  options: UseTurnEngineInput<TState, TAction, TEvents>,
): UseTurnEngineReturn<TState, TAction, TEvents> {
  const isExternalEngine = isEngineOption(options);

  const engineRef = useRef<ITurnEngineClient<TState, TAction, TEvents> | null>(null);
  if (!engineRef.current) {
    if (isExternalEngine) {
      engineRef.current = options.engine;
    } else {
      engineRef.current = createTurnEngine<TState, TAction, TEvents>(options);
    }
  }

  const engine = engineRef.current;

  useEffect(() => {
    return () => {
      if (!isExternalEngine && engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [isExternalEngine]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return engine.subscribe(onStoreChange);
    },
    [engine],
  );

  const getTurnSnapshot = useCallback(() => {
    return engine.getState();
  }, [engine]);

  const getRelaySnapshot = useCallback(() => {
    return engine.relay.getState();
  }, [engine]);

  const turnState = useSyncExternalStore(subscribe, getTurnSnapshot, getTurnSnapshot);
  const relayState = useSyncExternalStore(subscribe, getRelaySnapshot, getRelaySnapshot);

  const [stagedPatches, setStagedPatches] = useState<StagedFlightPatch<TState>[]>([]);

  const stageFlight = useCallback(
    (id: string, patch: (state: TState) => TState, metadata?: Record<string, unknown>) => {
      setStagedPatches((prev) => [...prev.filter((p) => p.id !== id), { id, patch, metadata }]);
      return () => {
        setStagedPatches((prev) => prev.filter((p) => p.id !== id));
      };
    },
    [],
  );

  const commitFlight = useCallback(
    (id: string, action: TAction) => {
      setStagedPatches((prev) => prev.filter((p) => p.id !== id));
      return engine.dispatch(action);
    },
    [engine],
  );

  const cancelFlight = useCallback((id: string) => {
    setStagedPatches((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const visualGameState = useMemo(() => {
    if (stagedPatches.length === 0) return turnState.gameState;
    let s = turnState.gameState;
    for (const patchItem of stagedPatches) {
      try {
        s = patchItem.patch(s);
      } catch {
        // preserve safe unpatched state if a patch throws
      }
    }
    return s;
  }, [turnState.gameState, stagedPatches]);

  return useMemo(
    () => ({
      ...turnState,
      dispatch: (action: TAction) => engine.dispatch(action),
      resetGameState: (nextState: TState, resetSeq?: boolean) =>
        engine.resetGameState(nextState, resetSeq),
      syncSnapshot: () => engine.syncSnapshot(),
      requestSync: () => engine.requestSync(),
      startTurnTimer: (durationMs?: number) => engine.startTurnTimer(durationMs),
      stopTurnTimer: () => engine.stopTurnTimer(),
      relayState,
      relay: engine.relay,
      engine,
      visualGameState,
      stagedFlights: stagedPatches,
      stageFlight,
      commitFlight,
      cancelFlight,
    }),
    [
      turnState,
      relayState,
      engine,
      visualGameState,
      stagedPatches,
      stageFlight,
      commitFlight,
      cancelFlight,
    ],
  );
}

