---
id: RFC-0011
title: "Proposal 11: Headless Kinetic Pipeline & Multi-Track Choreography (`useKineticPipeline`, `useKineticChoreography`, `trajectory.ts`, `handoff.ts`)"
status: RESOLVED
author: @lead
scope: alambre (kinetics)
summary: "Headless kinetic pipeline & multi-track choreography (`useKineticPipeline`, `useKineticChoreography`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 11: Headless Kinetic Pipeline & Multi-Track Choreography (`useKineticPipeline`, `useKineticChoreography`, `trajectory.ts`, `handoff.ts`)
- **Status**: RESOLVED (Implemented & Validated)
- **Author**: @lead
- **Resolution**:
  - Implemented headless stage-handoff coordinator `useKineticPipeline` in `packages/alambre/src/hooks/use-kinetic-pipeline.ts` managing `'idle' -> 'drag' -> 'flight' -> 'landing' -> 'settled'` lifecycles on the UI thread with continuous shared values, velocity-scaled duration, and FIFO batch queueing (`enqueue`, `enqueueBatch`).
  - Implemented headless multi-track animation chaining engine `useKineticChoreography` in `packages/alambre/src/hooks/use-kinetic-choreography.ts` supporting fluent `.chain().to().then().run()` sequences across 3D channels (`x`, `y`, `scale`, `rotateDeg`, `rotateXDeg`, `rotateYDeg`, `opacity`) without React render roundtrips.
  - Implemented pure parametric trajectory worklets (`linearTrajectory`, `parabolicTrajectory`, `arcTrajectory`, `quadraticBezier`, `cubicBezier`, `interpolateScalar`) in `packages/alambre/src/core/trajectory.ts`.
  - Implemented bounded gesture momentum transfer and critical damping math (`transferVelocity`, `projectEndpoint`, `calculateCriticalDamping`, `calculateDampingRatio`, `makeCriticallyDampedConfig`, `blendScalar`) in `packages/alambre/src/core/handoff.ts`.
  - Exported across `packages/alambre/src/index.ts`, documented in `docs/reference/hooks.md` §14–§15 and `docs/framework/architecture.md` §8, and validated by unit and public API contract suites (`tests/hooks/use-kinetic-pipeline.test.ts`, `tests/hooks/use-kinetic-choreography.test.ts`, `tests/core/trajectory.test.ts`, `tests/core/handoff.test.ts`).

### 1. Current Problem
- **Ad-Hoc Animation Sticking:** While `alambre` provides isolated kinetic primitives (`useKineticSwipe`, `useFlightTrajectory`, `useSpatialFlip`, `calculateHandFan`), chaining them across interaction lifecycles previously relied on asynchronous React state handoffs (`useState` + `onComplete` / `onDismissStart` callbacks).
- **React Commit Latency & Visual Flashing:** Unmounting an element in one container (e.g. `CardHand`) while mounting its projectile in another (e.g. `FlyingCard`) introduces a 1–2 frame React reconciliation delay. On lower-end devices or under JS thread activity, this causes cards to flicker, briefly vanish, or snap to slightly mismatched coordinate origins.
- **Inertia & Velocity Discontinuity:** When a card is dismissed via upward flick (`useKineticSwipe`), its terminal gesture velocity ($v_x, v_y$) was dropped upon release, resetting initial velocity to zero in `useFlightTrajectory` instead of smoothly continuing the ballistic impulse.
- **Race Conditions in Event Sequencing:** Multi-card sequential events (e.g. dealing 5 cards across room relay or rapid consecutive discards) lacked a coordinated FIFO queue, causing in-flight transitions to overwrite one another's target coordinates.

### 2. Proposed Solution
Extract headless, presentation-neutral **Kinetic Pipeline & Choreography** primitives:
1. **`useKineticPipeline<TStage extends string, TContext>`:**
   - Finite State Machine on the UI thread managing transition stages (`'idle' -> 'drag' -> 'flight' -> 'landing' -> 'settled'`).
   - Continuous shared value propagation: `translateX`, `translateY`, `rotateDeg`, and `scale` hand off smoothly from gesture responders to flight trajectories without unmounting or re-rendering.
   - Built-in FIFO stage queue (`enqueue`, `enqueueBatch`).
2. **`useKineticChoreography`:**
   - Multi-track UI-thread sequencer with fluent `.chain().to().then().run()` builder, parametric trajectories (`linear`, `parabolic`, `arc`), and `handoffGesture` velocity transfer.
3. **Momentum & Critical Damping Worklets (`handoff.ts`, `trajectory.ts`):**
   - `transferVelocity` and `makeCriticallyDampedConfig` convert high-velocity gesture releases into critically damped springs ($\zeta = 1.0$) with zero runaway oscillation.

### 3. Pros & Cons
- **Pros:**
  - Completely eliminates visual stutter, flashing, and coordinate jumps between gestures, flights, and landing surfaces.
  - Satisfies the 3-Line Rule for complex multi-stage flows without requiring application developers to write manual state machines or coordinate glue.
  - Retains headless purity: zero native dependencies, 100% presentation-agnostic.
- **Cons:**
  - Increases the exported hook and core math surface in `packages/alambre`, mitigated by strict public API contract tests.

---

[← Back to Proposals Index](./index.md)
