import { createRoomRelay } from "./client";
import type {
  DefaultRelayEvents,
  IRoomRelayClient,
  RelayMessage,
  RoomRelayOptions,
} from "./types";

export const TURN_ENGINE_EVENTS = {
  ACTION_INTENT: "TURN_ACTION_INTENT",
  ACTION_COMMIT: "TURN_ACTION_COMMIT",
  SYNC_REQUEST: "TURN_SYNC_REQUEST",
  SYNC_SNAPSHOT: "TURN_SYNC_SNAPSHOT",
} as const;

export interface TurnActionMeta {
  /** Monotonically increasing authoritative sequence number (1-indexed). */
  seq: number;
  /** Client ID of the peer who initiated the action. */
  senderId: string;
  /** Epoch timestamp (ms) when the action was committed by the host. */
  timestamp: number;
}

export type TurnReducer<TState, TAction> = (
  state: TState,
  action: TAction,
  meta: TurnActionMeta,
) => TState;

export interface TurnActionIntentPayload<TAction> {
  action: TAction;
  clientSeq: number;
}

export interface TurnActionCommitPayload<TState, TAction> {
  seq: number;
  action: TAction;
  senderId: string;
  timestamp: number;
  state: TState;
}

export interface TurnSyncRequestPayload {
  currentSeq: number;
}

export interface TurnSyncSnapshotPayload<TState> {
  seq: number;
  state: TState;
  timestamp: number;
}

export interface TurnEngineState<TState, TAction = unknown> {
  /** Current authoritative game state. */
  gameState: TState;
  /** Current authoritative sequence number (0 before any action is committed). */
  seq: number;
  /** Most recently committed action (or null). */
  lastAction: TAction | null;
  /** Client ID of the peer that triggered `lastAction` (or null). */
  lastSenderId: string | null;
  /** Epoch timestamp (ms) when the current turn timer expires, or null if inactive. */
  turnDeadline: number | null;
  /** Remaining milliseconds in the current turn timer, or null if inactive. */
  remainingTurnMs: number | null;
}

export interface TurnEngineOptions<
  TState,
  TAction,
  TEvents extends DefaultRelayEvents = DefaultRelayEvents,
> extends RoomRelayOptions<TEvents> {
  /** Existing RoomRelayClient instance to attach to (if omitted, creates an internal one). */
  client?: IRoomRelayClient<TEvents>;
  /** Initial authoritative game state. */
  initialState: TState;
  /** Pure deterministic state reducer executed on authoritative action commit. */
  reducer: TurnReducer<TState, TAction>;
  /**
   * Optional host-side guard to validate whether `senderId` is allowed to dispatch `action`
   * in the current `state` (e.g. verifying active player turn).
   */
  validateAction?: (state: TState, action: TAction, senderId: string) => boolean;
  /**
   * Optional duration in milliseconds for per-turn countdown timers.
   * When > 0, the timer resets automatically on each committed action.
   */
  turnDurationMs?: number;
  /** Tick interval in milliseconds for updating `remainingTurnMs`. @default 250 */
  timerTickMs?: number;
  /**
   * Callback invoked on the host when the turn timer expires.
   * If it returns a `TAction`, that action is automatically dispatched.
   */
  onTurnTimeout?: (state: TState, seq: number) => TAction | void;
  /** Callback fired whenever an authoritative action is committed. */
  onActionCommitted?: (action: TAction, state: TState, meta: TurnActionMeta) => void;
  /** Callback fired on the host when an action intent is rejected by `validateAction`. */
  onActionRejected?: (action: TAction, senderId: string, state: TState) => void;
  /** Callback fired when a full state snapshot is synchronized. */
  onSnapshotSynced?: (state: TState, seq: number) => void;
}

export interface ITurnEngineClient<
  TState,
  TAction,
  TEvents extends DefaultRelayEvents = DefaultRelayEvents,
> {
  readonly relay: IRoomRelayClient<TEvents>;
  getState(): TurnEngineState<TState, TAction>;
  subscribe(listener: () => void): () => void;
  /** Dispatches an action (commits immediately on host; sends intent to host when called by a guest). */
  dispatch(action: TAction): boolean;
  /** Host-only: forces a state replacement and broadcasts an authoritative snapshot to all peers. */
  resetGameState(nextState: TState, resetSeq?: boolean): void;
  /** Host-only: broadcasts the current authoritative state snapshot to all peers. */
  syncSnapshot(): void;
  /** Guest: requests the latest authoritative state snapshot from the host. */
  requestSync(): void;
  /** Starts or restarts the turn countdown timer. */
  startTurnTimer(durationMs?: number): void;
  /** Stops the active turn countdown timer. */
  stopTurnTimer(): void;
  /** Cleans up listeners, timers, and (if owned) the underlying relay client. */
  destroy(): void;
}

export class TurnEngineClient<
  TState,
  TAction,
  TEvents extends DefaultRelayEvents = DefaultRelayEvents,
> implements ITurnEngineClient<TState, TAction, TEvents>
{
  public readonly relay: IRoomRelayClient<TEvents>;
  private readonly ownsRelay: boolean;
  private readonly reducer: TurnReducer<TState, TAction>;
  private readonly validateAction?: (
    state: TState,
    action: TAction,
    senderId: string,
  ) => boolean;
  private readonly turnDurationMs?: number;
  private readonly timerTickMs: number;
  private readonly onTurnTimeout?: (state: TState, seq: number) => TAction | void;
  private readonly onActionCommitted?: (
    action: TAction,
    state: TState,
    meta: TurnActionMeta,
  ) => void;
  private readonly onActionRejected?: (
    action: TAction,
    senderId: string,
    state: TState,
  ) => void;
  private readonly onSnapshotSynced?: (state: TState, seq: number) => void;

  private state: TurnEngineState<TState, TAction>;
  private listeners = new Set<() => void>();
  private unsubs: Array<() => void> = [];
  private timerId: ReturnType<typeof setInterval> | null = null;
  private lastRelayStatus: string;
  private destroyed = false;

  constructor(options: TurnEngineOptions<TState, TAction, TEvents>) {
    this.reducer = options.reducer;
    this.validateAction = options.validateAction;
    this.turnDurationMs = options.turnDurationMs;
    this.timerTickMs = options.timerTickMs ?? 250;
    this.onTurnTimeout = options.onTurnTimeout;
    this.onActionCommitted = options.onActionCommitted;
    this.onActionRejected = options.onActionRejected;
    this.onSnapshotSynced = options.onSnapshotSynced;

    if (options.client) {
      this.relay = options.client;
      this.ownsRelay = false;
    } else {
      this.relay = createRoomRelay<TEvents>(options);
      this.ownsRelay = true;
    }

    this.state = {
      gameState: options.initialState,
      seq: 0,
      lastAction: null,
      lastSenderId: null,
      turnDeadline: null,
      remainingTurnMs: null,
    };

    this.lastRelayStatus = this.relay.getState().status;

    this.attachListeners();
  }

  private attachListeners(): void {
    // Listen for relay messages
    const unsubMsg = this.relay.onMessage((message) => {
      this.handleRelayMessage(message);
    });
    this.unsubs.push(unsubMsg);

    // Listen for connection status transitions (auto-request sync when guest connects)
    const unsubRelay = this.relay.subscribe(() => {
      const relayState = this.relay.getState();
      const prevStatus = this.lastRelayStatus;
      this.lastRelayStatus = relayState.status;

      if (prevStatus !== "connected" && relayState.status === "connected") {
        if (!relayState.isHost) {
          this.requestSync();
        }
      }
      this.emitChange();
    });
    this.unsubs.push(unsubRelay);
  }

  private handleRelayMessage(message: RelayMessage<string, unknown>): void {
    if (this.destroyed) return;
    const relayState = this.relay.getState();

    // Ignore self-echoed messages if any transport delivers them
    if (message.from === relayState.playerId) return;

    switch (message.type) {
      case TURN_ENGINE_EVENTS.ACTION_INTENT: {
        if (!relayState.isHost) return;
        const payload = message.payload as TurnActionIntentPayload<TAction>;
        if (!payload || payload.action === undefined) return;
        this.commitHostAction(payload.action, message.from);
        break;
      }

      case TURN_ENGINE_EVENTS.ACTION_COMMIT: {
        if (relayState.isHost) return;
        const payload = message.payload as TurnActionCommitPayload<TState, TAction>;
        if (!payload || typeof payload.seq !== "number") return;

        // Ignore duplicate or stale commits
        if (payload.seq <= this.state.seq) return;

        // If a sequence gap occurred and state wasn't embedded, request full snapshot
        if (payload.seq > this.state.seq + 1 && payload.state === undefined) {
          this.requestSync();
          return;
        }

        const meta: TurnActionMeta = {
          seq: payload.seq,
          senderId: payload.senderId,
          timestamp: payload.timestamp ?? message.timestamp,
        };

        const nextGameState =
          payload.state !== undefined
            ? payload.state
            : this.reducer(this.state.gameState, payload.action, meta);

        this.state = {
          ...this.state,
          gameState: nextGameState,
          seq: payload.seq,
          lastAction: payload.action,
          lastSenderId: payload.senderId,
        };

        if (this.turnDurationMs && this.turnDurationMs > 0) {
          this.startTurnTimer(this.turnDurationMs);
        } else {
          this.emitChange();
        }

        this.onActionCommitted?.(payload.action, nextGameState, meta);
        break;
      }

      case TURN_ENGINE_EVENTS.SYNC_REQUEST: {
        if (!relayState.isHost) return;
        this.syncSnapshot();
        break;
      }

      case TURN_ENGINE_EVENTS.SYNC_SNAPSHOT: {
        if (relayState.isHost) return;
        const payload = message.payload as TurnSyncSnapshotPayload<TState>;
        if (!payload || typeof payload.seq !== "number") return;

        if (payload.seq >= this.state.seq) {
          this.state = {
            ...this.state,
            gameState: payload.state,
            seq: payload.seq,
          };
          this.emitChange();
          this.onSnapshotSynced?.(payload.state, payload.seq);
        }
        break;
      }
    }
  }

  private commitHostAction(action: TAction, senderId: string): boolean {
    if (this.validateAction && !this.validateAction(this.state.gameState, action, senderId)) {
      this.onActionRejected?.(action, senderId, this.state.gameState);
      return false;
    }

    const nextSeq = this.state.seq + 1;
    const timestamp = Date.now();
    const meta: TurnActionMeta = {
      seq: nextSeq,
      senderId,
      timestamp,
    };

    const nextGameState = this.reducer(this.state.gameState, action, meta);

    this.state = {
      ...this.state,
      gameState: nextGameState,
      seq: nextSeq,
      lastAction: action,
      lastSenderId: senderId,
    };

    const commitPayload: TurnActionCommitPayload<TState, TAction> = {
      seq: nextSeq,
      action,
      senderId,
      timestamp,
      state: nextGameState,
    };

    this.relay.send(TURN_ENGINE_EVENTS.ACTION_COMMIT, commitPayload);

    if (this.turnDurationMs && this.turnDurationMs > 0) {
      this.startTurnTimer(this.turnDurationMs);
    } else {
      this.emitChange();
    }

    this.onActionCommitted?.(action, nextGameState, meta);
    return true;
  }

  public dispatch(action: TAction): boolean {
    if (this.destroyed) return false;
    const relayState = this.relay.getState();

    if (relayState.isHost) {
      return this.commitHostAction(action, relayState.playerId);
    }

    const intentPayload: TurnActionIntentPayload<TAction> = {
      action,
      clientSeq: this.state.seq,
    };
    this.relay.send(TURN_ENGINE_EVENTS.ACTION_INTENT, intentPayload);
    return true;
  }

  public resetGameState(nextState: TState, resetSeq: boolean = false): void {
    if (this.destroyed) return;
    const relayState = this.relay.getState();
    if (!relayState.isHost) return;

    const nextSeq = resetSeq ? 0 : this.state.seq + 1;
    this.state = {
      ...this.state,
      gameState: nextState,
      seq: nextSeq,
      lastAction: null,
      lastSenderId: relayState.playerId,
    };

    this.syncSnapshot();
  }

  public syncSnapshot(): void {
    if (this.destroyed) return;
    const relayState = this.relay.getState();
    if (!relayState.isHost) return;

    const snapshotPayload: TurnSyncSnapshotPayload<TState> = {
      seq: this.state.seq,
      state: this.state.gameState,
      timestamp: Date.now(),
    };
    this.relay.send(TURN_ENGINE_EVENTS.SYNC_SNAPSHOT, snapshotPayload);
    this.emitChange();
    this.onSnapshotSynced?.(this.state.gameState, this.state.seq);
  }

  public requestSync(): void {
    if (this.destroyed) return;
    const reqPayload: TurnSyncRequestPayload = {
      currentSeq: this.state.seq,
    };
    this.relay.send(TURN_ENGINE_EVENTS.SYNC_REQUEST, reqPayload);
  }

  public startTurnTimer(durationMs?: number): void {
    this.clearTimerInternal();
    const effectiveDuration = durationMs ?? this.turnDurationMs ?? 0;
    if (effectiveDuration <= 0) {
      this.state = {
        ...this.state,
        turnDeadline: null,
        remainingTurnMs: null,
      };
      this.emitChange();
      return;
    }

    const deadline = Date.now() + effectiveDuration;
    this.state = {
      ...this.state,
      turnDeadline: deadline,
      remainingTurnMs: effectiveDuration,
    };
    this.emitChange();

    this.timerId = setInterval(() => {
      if (this.destroyed || this.state.turnDeadline === null) {
        this.clearTimerInternal();
        return;
      }

      const remaining = Math.max(0, this.state.turnDeadline - Date.now());
      this.state = {
        ...this.state,
        remainingTurnMs: remaining,
      };
      this.emitChange();

      if (remaining <= 0) {
        this.clearTimerInternal();
        if (this.relay.getState().isHost && this.onTurnTimeout) {
          const timeoutAction = this.onTurnTimeout(this.state.gameState, this.state.seq);
          if (timeoutAction !== undefined) {
            this.dispatch(timeoutAction);
          }
        }
      }
    }, this.timerTickMs);
  }

  public stopTurnTimer(): void {
    this.clearTimerInternal();
    if (this.state.turnDeadline !== null || this.state.remainingTurnMs !== null) {
      this.state = {
        ...this.state,
        turnDeadline: null,
        remainingTurnMs: null,
      };
      this.emitChange();
    }
  }

  private clearTimerInternal(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public getState(): TurnEngineState<TState, TAction> {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitChange(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearTimerInternal();
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
    this.listeners.clear();
    if (this.ownsRelay) {
      this.relay.destroy();
    }
  }
}

export function createTurnEngine<
  TState,
  TAction,
  TEvents extends DefaultRelayEvents = DefaultRelayEvents,
>(
  options: TurnEngineOptions<TState, TAction, TEvents>,
): ITurnEngineClient<TState, TAction, TEvents> {
  return new TurnEngineClient<TState, TAction, TEvents>(options);
}

