---
id: RFC-0008
title: "Proposal 8: Spatial & Flight Kinetics (`useFlightTrajectory`, `useSpatialFlip`, and `calculateHandFan`)"
status: RESOLVED
author: @lead
scope: alambre (kinetics/flights)
summary: "Spatial & flight kinetics (`useFlightTrajectory`, `useSpatialFlip`, `calculateHandFan`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 8: Spatial & Flight Kinetics (`useFlightTrajectory`, `useSpatialFlip`, and `calculateHandFan`)
- **Status**: RESOLVED (Implemented & Validated)
- **Author**: @lead
- **Resolution**:
  - Implemented headless 3D card flip hook `useSpatialFlip` in `packages/alambre/src/hooks/use-spatial-flip.ts` with face-injected perspective, clamped parabolic elevation/scale, midpoint opacity step swap, and both controlled and uncontrolled support.
  - Implemented headless ballistic flight hook `useFlightTrajectory` in `packages/alambre/src/hooks/use-flight-trajectory.ts` with closed-form parabolic altitude lift, perspective scale peaks, rotation progression, dynamic runtime target overrides (`start(overrides)`), unmount cancellation, and flip-on-fly 3D face layers.
  - Implemented domain-neutral pure worklet functions `calculateHandFan` (radial angle spread, vertical arc drop, auto-compressed width span, selection lift) and `parabolicAltitudeCurve` in `packages/alambre/src/core/spatial.ts` and token namespace `kinetics.spatial`.
  - Refactored `FlipCard.tsx`, `FlyingCard.tsx`, and `CardHand.tsx` in `apps/playground/src/views/card-game/components/` to consume the new `alambre` spatial hooks, eliminating manual worklets and trigonometric math.
  - Authored unit test suites in `packages/alambre/tests/core/spatial.test.ts`, `packages/alambre/tests/hooks/use-spatial-flip.test.ts`, `packages/alambre/tests/hooks/use-flight-trajectory.test.ts`, and updated `packages/alambre/tests/public-api.test.ts`.

### 1. Current Problem
- **Imperative Math Boilerplate in Card Games and Modals:** In `apps/playground/src/views/card-game/`, `FlipCard`, `FlyingCard`, and `CardHand` relied on handcrafted Reanimated worklet math with hardcoded `Math.sin()` curves, manual 3D perspective handling, custom layout loops, and duplicate shared value synchronization.
- **Android Perspective Bug:** Standard React Native components fail to propagate `{ perspective: 1000 }` from container views down to child matrices (unlike CSS `preserve-3d`), resulting in flat 2D orthographic squishing on Android unless perspective is injected directly into each face's transform.
- **Spring Overshoot Table Depression:** When using underdamped Reanimated springs (`snap`, `responsive`), unclamped interpolation for parabolic vertical elevation causes the element to extrapolate into positive Y, visually punching downward through the table during the bounce.

### 2. Proposed Solution
1. **`useSpatialFlip`:**
   - Headless 3D perspective flip hook with `{ perspective }` placed directly on `frontAnimatedStyle` and `backAnimatedStyle` before `{ rotateY }` or `{ rotateX }`.
   - Clamped 2D parabolic lift and scale on `containerAnimatedStyle` to prevent negative/downward table penetration.
   - Synchronous boolean `isFlipped`, progress shared value, fresh callback refs, and unmount cancellation.
2. **`useFlightTrajectory`:**
   - Headless ballistic projectile flight from `from` to `to` coordinates with normalized parabolic lift $f(t) = 4t(1 - t)$ multiplied by `-liftHeight`.
   - Altitude perspective scale peak at $t = 0.5$ (`[startScale, peakScale, endScale]`).
   - Supports `start({ from, to, durationMs })` for dynamically measured targets (e.g. from deck layout to player hand slot).
   - Optional `flipOnFly` 180° rotation around Y axis.
3. **`calculateHandFan`:**
   - Domain-neutral worklet pure function computing `{ translateX, translateY, rotateDeg, scale, zIndex }`.
   - Computes radial fanning, vertical arc curvature, automatic span compression when `total` exceeds `maxSpan`, and selection transforms (`selectedLift`, `selectedScale`, `selectedStraightenFactor`).

### 3. Pros & Cons
- **Pros:**
  - Satisfies "The 3-Line Rule": card games, flight trajectories, and 3D flips can be built without writing raw trigonometric worklets or manual interpolation.
  - Headless purity: completely decoupled from playing card visuals, DOM styles, or hard native dependencies.
  - Eliminates platform-specific 3D perspective bugs on Android.
- **Cons:**
  - Adds two hooks and two pure math functions to `packages/alambre`, which are thoroughly documented and covered by contract tests.

---

[← Back to Proposals Index](./index.md)
