---
id: RFC-0010
title: "Proposal 10: Headless Ephemeral Room Relay (`@alambre/room-relay`)"
status: RESOLVED
author: @lead
scope: alambre/relay (@alambre/room-relay)
summary: "Headless ephemeral room relay for multiplayer session synchronization."
---

[← Back to Proposals Index](./index.md)

# Proposal 10: Headless Ephemeral Room Relay (`@alambre/room-relay`)
- **Status**: RESOLVED (Implemented & Validated)
- **Author**: @lead
- **Resolution**:
  - Extracted and architecturally upgraded the ephemeral multiplayer synchronization engine from `apps/playground/src/views/card-game/relay/roomRelay.ts` into a standalone headless workspace package: `packages/room-relay` (`@alambre/room-relay`).
  - Decoupled stateful networking into a pure TypeScript core client (`RoomRelayClient` and `createRoomRelay`) runnable in Node, Web, or background tasks, with generic event maps (`send<K>`, `on<K>`) that allow consuming high-frequency game streams without triggering React state re-renders.
  - Implemented tearing-free React bindings (`useRoomRelay`, `useRoomRelaySelector`) synchronized via `useSyncExternalStore`.
  - Implemented dual transports: `SimulatedRelayTransport` (in-memory edge hub with latency/jitter simulation for offline development and multi-client testbed verification) and `WebSocketRelayTransport` (universal edge WebSocket client with exponential backoff, jitter, intentional disconnect detection, and listener cleanup).
  - Implemented unambiguous room code utilities (`generateRoomCode`, `sanitizeRoomCode`) using a 30-character alphabet excluding confusing glyphs (I, 1, O, 0).
  - Implemented ping/pong heartbeat with a watchdog timeout detecting half-open TCP connection drops.
  - Added 24 unit and contract tests in `packages/room-relay/tests/` and re-pointed `apps/playground/src/views/card-game/CardGameTestbed.tsx` and playground tests to consume `@alambre/room-relay`.
  - Documented in `docs/reference/room-relay.md`, `docs/framework/architecture.md` §8, and `docs/index.md`.

---

[← Back to Proposals Index](./index.md)
