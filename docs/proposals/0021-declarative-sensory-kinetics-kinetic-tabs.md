---
id: RFC-0021
title: "Proposal 21: Declarative Sensory Kinetics, Kinetic Tabs & Headless Virtualized Sortable Lists (`useKineticTabs`, `AppSkeleton`, `SortableList`)"
status: PROPOSED
author: @lead
scope: alambre (kinetics, components), alambre/ui
summary: "Declarative sensory kinetics, kinetic tabs & headless virtualized sortable lists (`useKineticTabs`, `AppSkeleton`, `SortableList`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 21: Declarative Sensory Kinetics, Kinetic Tabs & Headless Virtualized Sortable Lists (`useKineticTabs`, `AppSkeleton`, `SortableList`)
- **Status**: PROPOSED
- **Author**: @lead

### 1. Current Problem
- **Decoupled Kinetics and Sensory Cues:** While `createSensoryCues` provides an external store for audio/haptics, kinetic hooks (`useWheelPicker`, `useSpatialFlip`, `useInteractiveHand`, `useCascadeFlight`, `useSpatialToss`) require developers to manually invoke cues in ad-hoc callbacks.
- **Unpromoted `GummyTabs` in `apps/playground`:** Animated spring-loaded tab navigation with Reanimated width/offset tracking is implemented locally in `apps/playground/src/components/test-utils/GummyTabs.tsx` without an accessible framework counterpart.
- **No 2D Sortable Grid or Vertical Sortable List:** `SortableRow` only handles 1D horizontal sorting; complex card games and dashboard layouts need vertical or 2D grid drag-and-drop with auto-scroll compensation for `SpatialSpace`.
- **Micro-Timer Flooding in Loading States:** Skeletons in consumer apps frequently instantiate independent `withRepeat` animations, competing with gestures on the UI thread.

### 2. Proposed Solution
1. **Declarative Sensory Hooks:**
   - Allow kinetic hooks to accept an optional `sensory?: { onPress?: TCue; onFlipMidpoint?: TCue; onTick?: TCue; onLand?: TCue }` map, automatically triggering registered haptics at physical inflection points.
2. **Headless `useKineticTabs` & `@alambre/ui` `AppTabs`:**
   - Extract kinetic tab physics (sliding pill bounds, spring settling, keyboard arrow accessibility) into headless `useKineticTabs` and styled `AppTabs`.
3. **`SortableList` & `SortableGrid`:**
   - Build on `DndProvider` to support vertical lists and multi-column grids with auto-scrolling near screen boundaries.
4. **Single-Clock `AppSkeleton`:**
   - Provide an accessible skeleton loader driven by `useLoopClock`, ensuring all pulsing elements on screen share a single $O(1)$ clock cycle.

### 3. Pros & Cons
- **Pros:**
  - Gives tactile interfaces effortless haptic/audio feedback without worklet glue code.
  - Fills major component gaps in `@alambre/ui`.
- **Cons:**
  - Expands the headless gesture and UI component surface.

---

[← Back to Proposals Index](./index.md)
