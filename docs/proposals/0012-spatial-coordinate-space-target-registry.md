---
id: RFC-0012
title: "Proposal 12: Headless Spatial Coordinate Space, Target Registry & Toss Physics (`SpatialSpace`, `useSpatialTarget`, `useSpatialToss`)"
status: RESOLVED
author: @lead
scope: alambre (kinetics/spatial)
summary: "Headless spatial coordinate space, target registry & toss physics (`SpatialSpace`, `useSpatialTarget`, `useSpatialToss`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 12: Headless Spatial Coordinate Space, Target Registry & Toss Physics (`SpatialSpace`, `useSpatialTarget`, `useSpatialToss`)
- **Status**: RESOLVED (Implemented in `packages/alambre` — `<SpatialSpace>`, `useSpatialTarget`, `useSpatialVector`, `useSpatialToss` / `useCardToss`, and spatial collision/jitter/toss helpers in `src/core/spatial.ts`)
- **Author**: @lead

### 1. Current Problem
- **Fragile Nested `onLayout` Coordinate Chaining:** In `apps/playground/src/views/card-game/CardGameTestbed.tsx` and `MultiplayerArena.tsx`, computing projectile flight vectors between nested containers (e.g. from the Draw Deck inside `CardTable` to a slot inside `CardHand`, or from an opponent's badge to the play zone) requires maintaining 6+ separate `useState` layout objects and manually summing parent offsets (`tableCardLayout.x + tableMatLayout.x + deckLayout.x + (deckLayout.width - 76) / 2`). Any layout padding, scroll offset, or wrapper insertion silently breaks trajectory alignment.
- **App-Locked Collision & Toss Math:** Pure 2D spatial hit-testing (`pointInBounds`, `findTargetDropZone`, `getZoneCenter`), deterministic FNV-1a pile jitter (`generateStackJitter`), inertial landing projection (`projectTossLanding`, `resolveTossDynamics`), and the `useCardToss` gesture hook currently reside inside `apps/playground/src/views/card-game/`. With the upcoming standalone Card Game application (`apps/<card-game>`) creating a second consumer (Rule of Two, `docs/guidelines/agents.md` §6), keeping this math in `playground` would force ~400 LOC of duplication.

### 2. Proposed Solution
1. **Declarative Coordinate Space Registry (`<SpatialSpace>` & `useSpatialTarget`):**
   - `<SpatialSpace>`: Lightweight coordinate root that tracks its own container layout origin.
   - `useSpatialTarget(id, options)`: Returns `{ onLayout, bounds, center, isMeasured }` and registers the target's bounding box and center point in the shared `<SpatialSpace>` coordinate frame, supporting arbitrary nesting depth via relative layout accumulation or `measureLayout`.
   - `useSpatialVector(fromId, toId)`: Returns reactive `{ from, to, delta }` coordinates ready to feed directly into `useFlightTrajectory` or `useKineticChoreography`.
2. **Promote Pure Drop-Zone & Pile Jitter Math to `packages/alambre/src/core/spatial.ts`:**
   - Extract `pointInBounds`, `findTargetDropZone`, `getZoneCenter`, `generateStackJitter`, `projectTossLanding`, and generic `resolveTossDynamics<T>`.
3. **Promote Headless Toss Hook (`useSpatialToss<T>`):**
   - Extract and generalize `useCardToss` into `packages/alambre/src/hooks/use-spatial-toss.ts`, combining `Gesture.Pan()` drag tracking, horizontal velocity tilt (`calculateSwipeTilt`), inertial endpoint projection, drop-zone acceptance filtering, and critically damped spring restitution on miss.

### 3. Pros & Cons
- **Pros:**
  - Eliminates brittle manual coordinate math across multi-zone game boards (`deck`, `discardPile`, `playerHand`, `opponentZone`, `meldSlots`).
  - Centralizes worklet-safe 2D hit-testing and organic card-pile stacking jitter in `packages/alambre`.
- **Cons:**
  - Dynamic scroll containers inside a `<SpatialSpace>` require scroll offset compensation if targets move during flight.

---

[← Back to Proposals Index](./index.md)
