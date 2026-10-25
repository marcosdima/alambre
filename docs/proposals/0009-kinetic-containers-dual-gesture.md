---
id: RFC-0009
title: "Proposal 9: Kinetic Containers & Dual-Gesture Swipe (`useKineticSwipe` and `useKineticCarousel`)"
status: RESOLVED
author: @lead
scope: alambre (behaviors/swipe)
summary: "Kinetic containers & dual-gesture swipe (`useKineticSwipe`, `useKineticCarousel`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 9: Kinetic Containers & Dual-Gesture Swipe (`useKineticSwipe` and `useKineticCarousel`)
- **Status**: RESOLVED (Implemented & Validated)
- **Author**: @lead
- **Resolution**:
  - Implemented headless dual-gesture swipe hook `useKineticSwipe` in `packages/alambre/src/hooks/use-kinetic-swipe.ts`. Provides 120 FPS UI-thread execution via `Gesture.Pan()` with universal `PanResponder` fallback for bare environments. Features escape velocity detection (>750 pt/s flick dismissal), dynamic rotation tilt proportional to horizontal translation, directional multi-axis snap boundaries, unmount safety, and separate `onDismissStart` / `onDismiss` lifecycle hooks.
  - Implemented headless kinetic carousel driver `useKineticCarousel`, `KineticCarouselProvider`, and `useKineticCarouselItem` in `packages/alambre/src/hooks/use-kinetic-carousel.tsx`. Fulfills the 3-Line Rule without React Rules of Hooks crashes in item maps. Bundles pre-configured `scrollProps`, discrete snapping, active index synchronization, and auto-play with active drag touch pause.
  - Added pure spatial worklet functions `calculateCarouselTransform` (presets: `coverflow`, `card-stack`, `scale-fade`, `flat`) and `calculateSwipeTilt` in `packages/alambre/src/core/spatial.ts` and token namespace `kinetics.spatial`.
  - Authored `apps/playground/src/views/kinetics/KineticContainerTestbed.tsx` demonstrating 3D coverflow carousels, deck swipe/flick trays, 4-way multi-axis action pads, and 20-item stress lists.
  - Refactored `FlipWithTranslationDemo` in `apps/playground/src/views/card-game/CardGameTestbed.tsx` to consume `FlyingCard` / `useFlightTrajectory`.
  - Added unit test suites in `packages/alambre/tests/hooks/use-kinetic-swipe.test.ts` and `packages/alambre/tests/hooks/use-kinetic-carousel.test.tsx`, and updated `packages/alambre/tests/public-api.test.ts`.

### 1. Current Problem
- **Gesture Contention & JS Bridge Latency:** Using standard `PanResponder` alone channels high-frequency move events across the native-to-JS bridge, causing lag behind the finger under JS load. Conversely, forcing `GestureDetector` everywhere breaks bare React Native environments lacking `GestureHandlerRootView`.
- **Carousel Rules of Hooks Trap:** Returning an `getItemAnimatedStyle` from a carousel hook that internally calls `useAnimatedStyle` crashes if invoked inside `.map()` loops.
- **Auto-Play Touch Conflicts:** Timer-driven carousels that don't pause on touch wrench the scroll view away from the user while they are actively dragging.

### 2. Proposed Solution
1. **`useKineticSwipe`:** Dual gesture support (`gesture` for RNGH + `panHandlers` for RN), escape velocity flick detection, rotation tilt, and distinct dismissal lifecycle callbacks (`onDismissStart` for visual trigger, `onDismiss` upon animation completion for safe unmounting).
2. **`useKineticCarousel` & `useKineticCarouselItem`:** Paired container/item hooks with context provider. Spreadable `scrollProps` configures `<Animated.ScrollView>` in one line. Interaction tracking (`onScrollBeginDrag` / `onScrollEndDrag`) pauses auto-play during touch.
3. **`calculateCarouselTransform`:** Pure worklets computing 3D Coverflow rotation, card depth stack, and scale fade on the UI thread without JS re-renders.

---

[← Back to Proposals Index](./index.md)
