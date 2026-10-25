---
id: RFC-0015
title: "Proposal 15: Headless Sensory Cues & Tactile Audio/Haptic Contract (`createSensoryCues`, `useSensoryFeedback`)"
status: RESOLVED
author: @lead
scope: alambre (capabilities)
summary: "Headless sensory cues & tactile audio/haptic contract (`createSensoryCues`, `useSensoryFeedback`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 15: Headless Sensory Cues & Tactile Audio/Haptic Contract (`createSensoryCues`, `useSensoryFeedback`)
- **Status**: RESOLVED (Implemented in `packages/alambre/src/capabilities/sensory.ts` — `createSensoryCues` / `createSensoryCuesProvider` with per-cue cooldown throttling, persistent mute toggles, and `useSensoryCues`)
- **Author**: @lead

### 1. Current Problem
- **Silent Kinetics:** Card games and tactile interfaces depend on synchronized micro-feedback—the crisp tick of each card dealt in a cascade, the snap of a 3D flip midpoint, the thud of a card landing on the table, or a light bump when crossing slot boundaries while reordering a hand.
- **No Standardized Adapter Contract:** Currently, only `usePressKinetics` exposes an isolated `hapticFeedback?: () => void` callback. Other kinetic hooks (`useFlightTrajectory`, `useSpatialFlip`, `useKineticSwipe`, `useKineticChoreography`) have no unified contract to trigger haptics or low-latency sound effects without coupling `packages/alambre` to native packages (`expo-haptics`, `expo-audio`).

### 2. Proposed Solution
1. **`createSensoryCues<TCue extends string>(config)` Capability:**
   - External-store-backed capability in `packages/alambre/src/capabilities/sensory/` following the same zero-Provider `useSyncExternalStore` pattern as `createConfig` and `createLightDark`.
   - Applications inject platform adapters (`onHaptic?: (cue: TCue) => void`, `onSound?: (cue: TCue) => void`) and bind user preferences (`hapticsEnabled`, `soundEnabled`).
   - Exposes imperative `cues.trigger(cue)` (callable via `runOnJS` from Reanimated worklet lifecycle points such as flip midpoint, cascade launch, or landing impact) and React hook `useSensoryCues()`.

### 3. Pros & Cons
- **Pros:**
  - Preserves 100% headless, zero-native-dependency purity in `packages/alambre` while giving apps a first-class way to wire `expo-haptics` and `expo-audio` into every kinetic primitive.
  - Respects user mute/vibration toggles globally without prop-drilling.
- **Cons:**
  - Rapid staggered cascades (e.g. <40ms intervals) require built-in cooldown throttling (`minIntervalMs`) so native haptic engines do not queue-flood.

---

[← Back to Proposals Index](./index.md)
