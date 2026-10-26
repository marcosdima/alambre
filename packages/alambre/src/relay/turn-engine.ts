import { createRoomRelay } from './client';
import type {
  DefaultRelayEvents,
  IRoomRelayClient,
  RelayMessage,
  RelayPeer,
  RoomRelayOptions,
} from './types';

export const TURN_ENGINE_EVENTS = {
  ACTION_INTENT: 'TURN_ACTION_INTENT',
  ACTION_COMMIT: 'TURN_ACTION_COMMIT',
  ACTION_REJECT: 'TURN_ACTION_REJECT',
  SYNC_REQUEST: 'TURN_SYNC_REQUEST',
  SYNC_SNAPSHOT: 'TURN_SYNC_SNAPSHOT',
  HOST_MIGRATED: 'TURN_HOST_MIGRATED',
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
  clientSeq?: number;
}

export interface TurnActionRejectPayload<TAction, TState = unknown> {
  action: TAction;
  clientSeq: number;
  senderId: string;
  reason?: string;
  authoritativeSeq: number;
  state: TState;
}

export interface TurnHostMigratedPayload {
  previousHostId: string;
  newHostId: string;
  seq: number;
  timestamp: number;
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
  /** Current authoritative or optimistic game state. */
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
  /** Whether the current gameState reflects speculative/optimistic actions ahead of host confirmation. */
  isOptimistic?: boolean;
  /** Number of pending optimistic actions awaiting host confirmation. */
  pendingActionsCount?: number;
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
  /** Callback fired on the host (or guest when rejected) when an action is rejected by `validateAction`. */
  onActionRejected?: (action: TAction, senderId: string, state: TState) => void;
  /** Callback fired when a full state snapshot is synchronized. */
  onSnapshotSynced?: (state: TState, seq: number) => void;
  /**
   * Optional host-side projection filter to redact hidden state for a specific peer (Fog-of-War).
   * Host preserves the complete authoritative state, while peers receive their projected view.
   */
  projectStateForPeer?: (state: TState, peerId: string) => TState | unknown;
  /**
   * When true, guest dispatch applies the reducer immediately on a speculative state fork (0ms latency),
   * ratifying or rolling back cleanly upon host confirmation or rejection.
   * @default false
   */
  optimistic?: boolean;
  /**
   * Whether to automatically elect and promote a new host when the current host drops.
   * Deterministically elects the surviving peer with earliest joinedAt.
   * @default true
   */
  autoHostMigration?: boolean;
  /**
   * Callback fired when a host migration occurs in the room.
   */
  onHostMigrated?: (newHostId: string, isHost: boolean, seq: number) => void;
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
  private readonly projectStateForPeer?: (state: TState, peerId: string) => TState | unknown;
  private readonly optimistic: boolean;
  private readonly autoHostMigration: boolean;
  private readonly onHostMigrated?: (newHostId: string, isHost: boolean, seq: number) => void;

  private state: TurnEngineState<TState, TAction>;
  private authoritativeState: TState;
  private pendingOptimisticActions: Array<{ clientSeq: number; action: TAction }> = [];
  private nextClientSeq = 0;
  private lastKnownHostId: string | null = null;
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
    this.projectStateForPeer = options.projectStateForPeer;
    this.optimistic = options.optimistic ?? false;
    this.autoHostMigration = options.autoHostMigration ?? true;
    this.onHostMigrated = options.onHostMigrated;

    if (options.client) {
      this.relay = options.client;
      this.ownsRelay = false;
    } else {
      this.relay = createRoomRelay<TEvents>(options);
      this.ownsRelay = true;
    }

    this.authoritativeState = options.initialState;
    this.state = {
      gameState: options.initialState,
      seq: 0,
      lastAction: null,
      lastSenderId: null,
      turnDeadline: null,
      remainingTurnMs: null,
      isOptimistic: false,
      pendingActionsCount: 0,
    };

    const initialRelayState = this.relay.getState();
    this.lastRelayStatus = initialRelayState.status;

    if (initialRelayState.isHost) {
      this.lastKnownHostId = initialRelayState.playerId;
    } else {
      const hostPeer = initialRelayState.peers.find((p) => p.isHost);
      this.lastKnownHostId = hostPeer?.id ?? null;
    }

    this.attachListeners();
  }

  private attachListeners(): void {
    // Listen for relay messages
    const unsubMsg = this.relay.onMessage((message) => {
      this.handleRelayMessage(message);
    });
    this.unsubs.push(unsubMsg);

    // Listen for connection status transitions & host dropouts
    const unsubRelay = this.relay.subscribe(() => {
      const relayState = this.relay.getState();
      const prevStatus = this.lastRelayStatus;
      this.lastRelayStatus = relayState.status;

      // Update host knowledge if uninitialized
      if (!this.lastKnownHostId) {
        if (relayState.isHost) {
          this.lastKnownHostId = relayState.playerId;
        } else {
          const hostPeer = relayState.peers.find((p) => p.isHost);
          if (hostPeer) this.lastKnownHostId = hostPeer.id;
        }
      }

      // Guest auto-sync on initial connect
      if (prevStatus !== 'connected' && relayState.status === 'connected') {
        if (!relayState.isHost) {
          this.requestSync();
        }
      }

      // Detect host dropout and initiate automatic host migration if enabled
      if (
        this.autoHostMigration &&
        !relayState.isHost &&
        this.lastKnownHostId &&
        this.lastKnownHostId !== relayState.playerId &&
        relayState.status === 'connected'
      ) {
        const hostStillPresent = relayState.peers.some((p) => p.id === this.lastKnownHostId);
        if (!hostStillPresent) {
          this.handleHostDropout(this.lastKnownHostId);
        }
      }

      this.emitChange();
    });
    this.unsubs.push(unsubRelay);
  }

  private handleHostDropout(droppedHostId: string): void {
    if (this.destroyed) return;
    const relayState = this.relay.getState();
    if (relayState.isHost) return;

    // Build candidate list of surviving connected peers
    const localPeer: RelayPeer = {
      id: relayState.playerId,
      name: relayState.playerName,
      isHost: false,
      lastSeen: Date.now(),
      joinedAt: relayState.joinedAt ?? Date.now(),
    };

    const survivingPeers = [
      localPeer,
      ...relayState.peers.filter((p) => p.id !== droppedHostId),
    ];

    // Deterministically elect the earliest connected peer (joinedAt ASC, then id ASC)
    survivingPeers.sort((a, b) => {
      const tA = a.joinedAt ?? 0;
      const tB = b.joinedAt ?? 0;
      if (Math.abs(tA - tB) > 1000) {
        return tA - tB;
      }
      return a.id.localeCompare(b.id);
    });

    const elected = survivingPeers[0];
    if (!elected) return;

    if (elected.id === relayState.playerId) {
      this.lastKnownHostId = elected.id;
      // Local client is elected as the new host!
      this.relay.setHost(true);

      const migrationPayload: TurnHostMigratedPayload = {
        previousHostId: droppedHostId,
        newHostId: relayState.playerId,
        seq: this.state.seq,
        timestamp: Date.now(),
      };
      this.relay.send(TURN_ENGINE_EVENTS.HOST_MIGRATED, migrationPayload);

      // Re-assert authoritative state snapshot
      this.syncSnapshot();

      // Resume turn timer if configured
      if (this.turnDurationMs && this.turnDurationMs > 0) {
        this.startTurnTimer(this.turnDurationMs);
      }

      this.onHostMigrated?.(relayState.playerId, true, this.state.seq);
      this.emitChange();
    }
  }

  private handleRelayMessage(message: RelayMessage<string, unknown>): void {
    if (this.destroyed) return;
    const relayState = this.relay.getState();

    // Ignore self-echoed messages
    if (message.from === relayState.playerId) return;

    switch (message.type) {
      case TURN_ENGINE_EVENTS.ACTION_INTENT: {
        if (!relayState.isHost) return;
        const payload = message.payload as TurnActionIntentPayload<TAction>;
        if (!payload || payload.action === undefined) return;
        this.commitHostAction(payload.action, message.from, payload.clientSeq);
        break;
      }

      case TURN_ENGINE_EVENTS.ACTION_COMMIT: {
        if (relayState.isHost) return;
        const payload = message.payload as TurnActionCommitPayload<TState, TAction>;
        if (!payload || typeof payload.seq !== 'number') return;

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

        const nextAuthoritativeState =
          payload.state !== undefined
            ? payload.state
            : this.reducer(this.authoritativeState, payload.action, meta);

        this.authoritativeState = nextAuthoritativeState;

        if (this.optimistic) {
          // Reconcile optimistic actions queue
          if (payload.senderId === relayState.playerId) {
            if (payload.clientSeq !== undefined) {
              const committedClientSeq = payload.clientSeq;
              this.pendingOptimisticActions = this.pendingOptimisticActions.filter(
                (p) => p.clientSeq > committedClientSeq,
              );
            } else {
              this.pendingOptimisticActions.shift();
            }
          }

          if (this.pendingOptimisticActions.length > 0) {
            // Replay remaining pending actions on top of authoritative base
            let replayed = this.authoritativeState;
            for (const pending of this.pendingOptimisticActions) {
              replayed = this.reducer(replayed, pending.action, {
                seq: payload.seq,
                senderId: relayState.playerId,
                timestamp: Date.now(),
              });
            }
            this.state = {
              ...this.state,
              gameState: replayed,
              seq: payload.seq,
              lastAction: payload.action,
              lastSenderId: payload.senderId,
              isOptimistic: true,
              pendingActionsCount: this.pendingOptimisticActions.length,
            };
          } else {
            this.state = {
              ...this.state,
              gameState: this.authoritativeState,
              seq: payload.seq,
              lastAction: payload.action,
              lastSenderId: payload.senderId,
              isOptimistic: false,
              pendingActionsCount: 0,
            };
          }
        } else {
          this.state = {
            ...this.state,
            gameState: nextAuthoritativeState,
            seq: payload.seq,
            lastAction: payload.action,
            lastSenderId: payload.senderId,
          };
        }

        if (this.turnDurationMs && this.turnDurationMs > 0) {
          this.startTurnTimer(this.turnDurationMs);
        } else {
          this.emitChange();
        }

        this.onActionCommitted?.(payload.action, nextAuthoritativeState, meta);
        break;
      }

      case TURN_ENGINE_EVENTS.ACTION_REJECT: {
        if (relayState.isHost) return;
        const payload = message.payload as TurnActionRejectPayload<TAction, TState>;
        if (!payload) return;

        if (payload.senderId === relayState.playerId) {
          // Discard rejected intent from optimistic queue
          this.pendingOptimisticActions = this.pendingOptimisticActions.filter(
            (p) => p.clientSeq !== payload.clientSeq,
          );

          if (
            payload.state !== undefined &&
            (payload.authoritativeSeq === undefined || payload.authoritativeSeq >= this.state.seq)
          ) {
            this.authoritativeState = payload.state as TState;
          }

          // Re-apply remaining valid optimistic actions on top of restored state
          let replayed = this.authoritativeState;
          for (const pending of this.pendingOptimisticActions) {
            replayed = this.reducer(replayed, pending.action, {
              seq: payload.authoritativeSeq ?? this.state.seq,
              senderId: relayState.playerId,
              timestamp: Date.now(),
            });
          }

          this.state = {
            ...this.state,
            gameState: replayed,
            seq: payload.authoritativeSeq ?? this.state.seq,
            isOptimistic: this.pendingOptimisticActions.length > 0,
            pendingActionsCount: this.pendingOptimisticActions.length,
          };

          this.emitChange();
          this.onActionRejected?.(payload.action, payload.senderId, this.authoritativeState);
        }
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
        if (!payload || typeof payload.seq !== 'number') return;

        if (payload.seq >= this.state.seq || payload.seq === 0) {
          this.authoritativeState = payload.state;

          if (this.optimistic && this.pendingOptimisticActions.length > 0) {
            let replayed = this.authoritativeState;
            for (const pending of this.pendingOptimisticActions) {
              replayed = this.reducer(replayed, pending.action, {
                seq: payload.seq,
                senderId: relayState.playerId,
                timestamp: Date.now(),
              });
            }
            this.state = {
              ...this.state,
              gameState: replayed,
              seq: payload.seq,
              isOptimistic: true,
              pendingActionsCount: this.pendingOptimisticActions.length,
            };
          } else {
            this.state = {
              ...this.state,
              gameState: payload.state,
              seq: payload.seq,
              isOptimistic: false,
              pendingActionsCount: 0,
            };
          }

          this.emitChange();
          this.onSnapshotSynced?.(payload.state, payload.seq);
        }
        break;
      }

      case TURN_ENGINE_EVENTS.HOST_MIGRATED: {
        const payload = message.payload as TurnHostMigratedPayload;
        if (!payload || !payload.newHostId) return;

        const wasKnown = this.lastKnownHostId === payload.newHostId;
        this.lastKnownHostId = payload.newHostId;
        const amIHost = payload.newHostId === relayState.playerId;

        // If another peer was elected, ensure local relay status demotes if needed
        if (!amIHost && relayState.isHost) {
          this.relay.setHost(false);
        }

        if (!wasKnown) {
          this.onHostMigrated?.(payload.newHostId, amIHost, payload.seq);
        }
        this.emitChange();
        break;
      }
    }
  }

  private commitHostAction(action: TAction, senderId: string, clientSeq?: number): boolean {
    if (this.validateAction && !this.validateAction(this.state.gameState, action, senderId)) {
      // Send rejection to client if intent came from a guest peer
      if (senderId !== this.relay.getState().playerId) {
        const stateForPeer = this.projectStateForPeer
          ? (this.projectStateForPeer(this.state.gameState, senderId) as TState)
          : this.state.gameState;

        const rejectPayload: TurnActionRejectPayload<TAction, TState> = {
          action,
          clientSeq: clientSeq ?? 0,
          senderId,
          reason: 'Action validation failed',
          authoritativeSeq: this.state.seq,
          state: stateForPeer,
        };
        this.relay.sendTo(senderId, TURN_ENGINE_EVENTS.ACTION_REJECT, rejectPayload);
      }
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

    this.authoritativeState = nextGameState;
    this.state = {
      ...this.state,
      gameState: nextGameState,
      seq: nextSeq,
      lastAction: action,
      lastSenderId: senderId,
      isOptimistic: false,
      pendingActionsCount: 0,
    };

    const peers = this.relay.getState().peers;

    if (this.projectStateForPeer && peers.length > 0) {
      // Point-to-point Fog-of-War state projection
      for (const peer of peers) {
        const projectedState = this.projectStateForPeer(nextGameState, peer.id) as TState;
        const commitPayload: TurnActionCommitPayload<TState, TAction> = {
          seq: nextSeq,
          action,
          senderId,
          timestamp,
          state: projectedState,
          clientSeq,
        };
        this.relay.sendTo(peer.id, TURN_ENGINE_EVENTS.ACTION_COMMIT, commitPayload);
      }
    } else {
      // Standard room-wide broadcast
      const commitPayload: TurnActionCommitPayload<TState, TAction> = {
        seq: nextSeq,
        action,
        senderId,
        timestamp,
        state: nextGameState,
        clientSeq,
      };
      this.relay.send(TURN_ENGINE_EVENTS.ACTION_COMMIT, commitPayload);
    }

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

    if (this.optimistic) {
      const clientSeq = ++this.nextClientSeq;
      this.pendingOptimisticActions.push({ clientSeq, action });

      const meta: TurnActionMeta = {
        seq: this.state.seq,
        senderId: relayState.playerId,
        timestamp: Date.now(),
      };

      const speculativeState = this.reducer(this.state.gameState, action, meta);
      this.state = {
        ...this.state,
        gameState: speculativeState,
        isOptimistic: true,
        pendingActionsCount: this.pendingOptimisticActions.length,
      };
      this.emitChange();

      const intentPayload: TurnActionIntentPayload<TAction> = {
        action,
        clientSeq,
      };
      this.relay.send(TURN_ENGINE_EVENTS.ACTION_INTENT, intentPayload);
      return true;
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
    this.authoritativeState = nextState;
    this.state = {
      ...this.state,
      gameState: nextState,
      seq: nextSeq,
      lastAction: null,
      lastSenderId: relayState.playerId,
      isOptimistic: false,
      pendingActionsCount: 0,
    };

    this.syncSnapshot();
  }

  public syncSnapshot(): void {
    if (this.destroyed) return;
    const relayState = this.relay.getState();
    if (!relayState.isHost) return;

    const peers = relayState.peers;

    if (this.projectStateForPeer && peers.length > 0) {
      // Send individual projected snapshots for Fog-of-War
      for (const peer of peers) {
        const projectedState = this.projectStateForPeer(this.state.gameState, peer.id) as TState;
        const snapshotPayload: TurnSyncSnapshotPayload<TState> = {
          seq: this.state.seq,
          state: projectedState,
          timestamp: Date.now(),
        };
        this.relay.sendTo(peer.id, TURN_ENGINE_EVENTS.SYNC_SNAPSHOT, snapshotPayload);
      }
    } else {
      const snapshotPayload: TurnSyncSnapshotPayload<TState> = {
        seq: this.state.seq,
        state: this.state.gameState,
        timestamp: Date.now(),
      };
      this.relay.send(TURN_ENGINE_EVENTS.SYNC_SNAPSHOT, snapshotPayload);
    }

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
