---
id: RFC-0020
title: "Proposal 20: Multiplayer Fog-of-War, Optimistic Action Execution & Host Migration (`TurnEngineClient`, `@alambre/room-relay`)"
status: RESOLVED
author: @lead
scope: alambre/relay (@alambre/room-relay)
summary: "Multiplayer fog-of-war, optimistic action execution & host migration (`TurnEngineClient`, `@alambre/room-relay`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 20: Multiplayer Fog-of-War, Optimistic Action Execution & Host Migration (`TurnEngineClient`, `@alambre/room-relay`)
- **Status**: RESOLVED
- **Author**: @lead

### 1. Current Problem
- **Full State Leakage (No Fog-of-War):** `TurnEngineClient` broadcasts the entire authoritative `nextGameState` on every `TURN_ACTION_COMMIT` and `TURN_SYNC_SNAPSHOT`. In card games with private hands or hidden draw decks, every client receives opposing cards in the raw network payload.
- **Guest Latency Stutter (No Optimistic Actions):** In `TurnEngineClient.dispatch()`, guests only dispatch `TURN_ACTION_INTENT` and await host confirmation. On high-latency mobile connections (150ms+ RTT), player cards remain frozen until the host commit arrives.
- **Session Termination on Host Drop:** If the host player closes the app or encounters a network dropout, the room becomes permanently inert with no mechanism to elect a new host.

### 2. Proposed Solution
1. **Fog-of-War / State Projection (`projectStateForPeer`):**
   - Introduce an optional host projection filter: `projectStateForPeer?: (state: TState, peerId: string) => TPublicState | TState`.
   - Allows hosts to censor hidden information (e.g. replacing opponent card IDs with `null` or face-down card tokens) before broadcasting commits or snapshots.
2. **Optimistic Action Execution & Rollback:**
   - Add `optimistic?: boolean` to `TurnEngineOptions`. When enabled, guest `dispatch(action)` applies the reducer immediately to an optimistic state fork.
   - If the host commits with a matching `clientSeq`, optimistic state is ratified; if the host rejects (`TURN_ACTION_REJECT`), the client rolls back smoothly to the authoritative state.
3. **Automated Host Migration:**
   - Because all connected peers track monotonic sequence numbers (`seq`) and maintain snapshots, implement deterministic host election based on connection priority (`joinedAt`) when the heartbeat watchdog marks the host disconnected.

### 3. Pros & Cons
- **Pros:**
  - Enables cheat-proof competitive card and board games over public relays.
  - Eliminates input lag for guests via optimistic local prediction.
  - Prevents abandoned rooms on host disconnection.
- **Cons:**
  - Optimistic actions require pure, deterministic reducers on both guest and host.

### 4. Resolution
- **Targeted Peer Messaging & Joined Timestamps**:
  - Added optional `to?: string` targeting on `RelayMessage`.
  - Added `joinedAt?: number` on `RelayPeer` and `RoomRelayState`.
  - Added `sendTo(peerId, type, payload)` and `setHost(peerId)` actions in `RoomRelayActions`, implemented in `SimulatedRelayTransport`, `RoomRelayClient`, and exposed in `useRoomRelay`.
- **Fog-of-War (`projectStateForPeer`)**:
  - `TurnEngineOptions` accepts `projectStateForPeer?: (state: TState, peerId: string) => TState`.
  - Host broadcasts redacted peer-specific snapshots and commits via targeted peer delivery (`sendTo`), while local host state remains authoritative and unredacted.
  - Rejection frames (`ACTION_REJECT`) also pass through `projectStateForPeer` before transmission, eliminating data leaks.
- **Optimistic Actions & Deterministic Rollback**:
  - `TurnEngineOptions` accepts `optimistic?: boolean`.
  - Guest `dispatch(action)` queues optimistic actions with monotonic `clientSeq` and immediately computes `optimisticGameState`.
  - On host commit, acknowledged client sequences are pruned and remaining pending actions are replayed over the authoritative base.
  - On host rejection (`ACTION_REJECT`), optimistic mutations roll back instantaneously to the host-provided authoritative state.
- **Automated Deterministic Host Election**:
  - When the room relay detects host disconnection, remaining connected peers evaluate the oldest peer using `joinedAt` (with lexicographical peer ID tie-breaking).
  - The elected peer promotes itself via `relay.actions.setHost(candidateId)`, broadcasts `HOST_MIGRATED` with its current snapshot, and seamlessly assumes turn engine authority without data loss.

---

[← Back to Proposals Index](./index.md)
