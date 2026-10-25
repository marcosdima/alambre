---
id: RFC-0014
title: "Proposal 14: Deterministic Turn Engine, Seeded PRNG & State Snapshots (`@alambre/room-relay`)"
status: RESOLVED
author: @lead
scope: alambre/relay (@alambre/room-relay)
summary: "Deterministic turn engine, seeded PRNG & state snapshots (`createTurnEngine`, `useTurnEngine`, `createSeededRng`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 14: Deterministic Turn Engine, Seeded PRNG & State Snapshots (`@alambre/room-relay`)
- **Status**: RESOLVED (Implemented in `@alambre/room-relay` — `hashSeed`, `createSeededRng`, `shuffleWithSeed`, `TurnEngineClient`, `createTurnEngine`, and `useTurnEngine`)
- **Author**: @lead

### 1. Current Problem
- **Non-Deterministic `Math.random()` Shuffling:** `apps/playground/src/views/card-game/engine/deck.ts` and `MultiplayerArena.tsx` rely on `Math.random()`. In multiplayer card games, unseeded randomness prevents deterministic match replays, verifiable fair shuffles, and compact seed synchronization.
- **No Late-Join or Reconnect State Recovery:** `use-card-relay-sync.ts` only broadcasts incremental action events (`GAME_DEAL`, `CARD_PLAY`, `CARD_DRAW`). If a player's mobile connection drops for 2 seconds or a spectator/peer joins an active room, `WebSocketRelayTransport` reconnects the socket, but the client has no mechanism to request or reconcile the current authoritative board state.
- **Optimistic Race Conditions & Missing Turn Watchdogs:** Local actions apply immediately without monotonic sequence numbers (`seq`) or host arbitration, and there is no headless turn countdown/timeout primitive for enforcing turn limits.

### 2. Proposed Solution
1. **Deterministic Seeded PRNG & Collection Shuffling (`createSeededRng`, `shuffleWithSeed`):**
   - Add a fast, zero-dependency, deterministic 32-bit PRNG (Mulberry32 / SplitMix32) and pure Fisher-Yates `shuffleWithSeed<T>(items, seed)` helper in `@alambre/room-relay` (or `packages/alambre`), allowing peers to generate identical decks from a shared numeric/string seed.
2. **Headless Authoritative Turn Engine (`useTurnEngine<TState, TAction>` in `@alambre/room-relay`):**
   - Wraps `useRoomRelay` with a reducer-driven state machine `(state, action) => nextState`.
   - **Host Arbitration & Monotonic Sequencing:** Assigns strictly increasing `seq` numbers to ratified actions; guests apply optimistic previews or await host ratification (`ACTION_INTENT` $\rightarrow$ `ACTION_COMMIT`).
   - **Automatic Snapshot Handshake:** When a peer joins or reconnects with a stale `seq`, automatically dispatches `SYNC_REQUEST` and hydrates from the Host's `SYNC_SNAPSHOT` response.
   - **Synchronized Turn Timer:** Optional per-turn deadline (`turnDurationMs`) exposing reactive remaining time and automatic `onTurnTimeout` host callback.

### 3. Pros & Cons
- **Pros:**
  - Turns `@alambre/room-relay` from a raw message pipe into a complete, resilient multiplayer state engine for any turn-based card or board game.
  - Makes multiplayer matches 100% reproducible in Vitest unit tests via seeded PRNG + `SimulatedRelayTransport`.
- **Cons:**
  - Host-authoritative arbitration still depends on the Host remaining connected (mitigated by snapshot caching on guests for potential host migration).

---

[← Back to Proposals Index](./index.md)
