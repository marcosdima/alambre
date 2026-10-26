---
id: RFC-0021
title: "Proposal 21: Declarative Sensory Kinetics, Kinetic Tabs & Headless Virtualized Sortable Lists (`useKineticTabs`, `AppSkeleton`, `SortableList`)"
status: RESOLVED
author: @lead
scope: alambre (kinetics, components), alambre/ui
summary: "Declarative sensory kinetics, kinetic tabs & headless virtualized sortable lists (`useKineticTabs`, `AppSkeleton`, `SortableList`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 21: Declarative Sensory Kinetics, Kinetic Tabs & Headless Virtualized Sortable Lists (`useKineticTabs`, `AppSkeleton`, `SortableList`)
- **Status**: RESOLVED
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

### 4. Resolution
- **Declarative Sensory Kinetics System**:
  - Implemented `dispatchSensoryCue`, `KineticSensoryConfig`, `SensoryTriggerDispatcher` in `packages/alambre/src/types/sensory-kinetics.ts`.
  - Seamlessly wired into `usePressKinetics`, `useSpatialFlip` (90° inflection midpoint & settle), `useWheelPicker` (discrete item ticks & snapping), and `useSpatialToss` (toss & drop landing).
  - Works with `createSensoryCues` stores, action dispatchers, or raw callback functions with zero worklet boilerplate.
- **Headless `useKineticTabs` & `@alambre/ui` `AppTabs`**:
  - Implemented `useKineticTabs` in `packages/alambre/src/hooks/use-kinetic-tabs.ts` with spring-driven indicator offset/width tracking, auto-layout measurements, and full WAI-ARIA tablist accessibility (`tablist`, `tab`, `aria-selected`, keyboard actions).
  - Implemented `AppTabs` in `packages/alambre/src/ui/components/AppTabs.tsx` supporting pill and segmented indicator styles, badges, icons, and theme integration.
  - Modernized `apps/playground/src/components/test-utils/GummyTabs.tsx` to wrap `AppTabs`.
- **`SortableList` & `SortableGrid`**:
  - Implemented `SortableList` (1D vertical) and `SortableGrid` (2D multi-column) in `packages/alambre/src/components/dnd/`.
  - Feature physics-driven neighbour shift springs (`glide`, `linear`, `bounce`, `instant`), ballistic velocity reordering, accessible TalkBack/VoiceOver reordering actions (`moveUp`, `moveDown`, `moveLeft`, `moveRight`), and seamless reduced motion handling.
- **Single-Clock `AppSkeleton`**:
  - Implemented `AppSkeleton` in `packages/alambre/src/ui/components/AppSkeleton.tsx` powered by unified `useLoopClock`.
  - Supports `text`, `rect`, `circle`, and `pill` variants with $O(1)$ rendering overhead, static fallback under `useReducedMotion()`, and accessible `progressbar` semantics.

---

[← Back to Proposals Index](./index.md)
