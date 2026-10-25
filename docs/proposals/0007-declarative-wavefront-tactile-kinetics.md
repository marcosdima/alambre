---
id: RFC-0007
title: "Proposal 7: Declarative Wavefront Orchestration & Headless Tactile Kinetics (`WavefrontProvider`, `useWavefrontItem`, `usePressKinetics`)"
status: RESOLVED
author: @lead
scope: alambre (hooks)
summary: "Declarative wavefront orchestration & press kinetics (`WavefrontProvider`, `useWavefrontItem`, `usePressKinetics`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 7: Declarative Wavefront Orchestration & Headless Tactile Kinetics (`WavefrontProvider`, `useWavefrontItem`, `usePressKinetics`)

### Status: RESOLVED
- Shipped declarative compound provider `<WavefrontProvider>` and headless item hook `useWavefrontItem` (along with aliases `KineticOrchestratorProvider` and `useKineticOrchestratorItem`) in `packages/alambre/src/hooks/use-wavefront.tsx`.
- Shipped universal headless press interaction hook `usePressKinetics` in `packages/alambre/src/hooks/use-press-kinetics.ts`.
- Validated "The 3-Line Rule" for consumer ergonomics across `apps/playground`:
  - `KineticOrchestratorTestbed.tsx` refactored across Feed Waterfall, Filter Chips, Metric Wave, and Chaos Matrix.
  - Playground UI primitives `AppButton.tsx` and `AppCard.tsx` refactored to consume `usePressKinetics`, eliminating raw Reanimated boilerplate.
- Comprehensive contract and unit test suites authored in `packages/alambre/tests/hooks/use-wavefront.test.tsx` and `packages/alambre/tests/hooks/use-press-kinetics.test.ts`.
- Public API contract registered in `packages/alambre/tests/public-api.test.ts`.

### 1. Current Problem
- **Boilerplate and Agent Token Overhead:** While `useWavefront` solved the $N$-ODE spring concurrency issue mathematically, consumer components still had to manually instantiate `useAnimatedStyle`, drill `progress` shared values, call `calculateWavefrontPhase` / `getItemProgress`, and map styles by hand. Agents generating screen code were forced to write 15–25 lines of Reanimated worklet math per staggered component, wasting tokens and risking worklet dependency mistakes.
- **Fragmented Tactile Feedback:** Across apps and testbeds, buttons, cards, list rows, and interactive chips repeatedly implemented ad-hoc `useSharedValue`, `withSpring`, and gesture handlers for micro-touch feedback (scale down on press, bounce on release). This created widespread code duplication and inconsistent spring physics.

### 2. Proposed Solution
1. **Declarative Wavefront Context & Hook:**
   - `<WavefrontProvider>`: Accepts an existing wavefront instance or options (`count`, `staggerMs`, `itemDuration`, `curve`), using an internal subcomponent to ensure React hook order safety without conditional hook calls.
   - `useWavefrontItem(index, options)`: Returns `{ animatedStyle, getItemProgress, getItemPhase, progress, phase, isReducedMotion }`. Supports pre-baked presets (`'slide-up'`, `'slide-scale'`, `'slide-down'`, `'fade'`, `'scale'`, `'pop'`) and custom style worklets.
2. **Universal Headless Press Kinetics:**
   - `usePressKinetics(options)`: Headless tactile hook returning `{ pressProps, animatedStyle, isPressed, pressed }`.
   - Physics: Asymmetric responsive spring on press-in (`kinetics.spring.responsive` with clamp) and bouncy release (`kinetics.spring.bouncy` with natural overshoot).
   - Zero-rerender default (`trackState: false`), reduced motion support, spread-safe `pressProps`, and optional decoupled haptic callback (`hapticFeedback?: () => void`).

### 3. Pros & Cons
- **Pros:**
  - Satisfies "The 3-Line Rule": agents can drop in high-performance entering and touch animations in 3 lines of code without manual worklets.
  - Zero native hard dependencies: preserves headless purity in `packages/alambre`.
  - Replaces hundreds of lines of duplicated Reanimated boilerplate across components.
- **Cons:**
  - Increases the exported hook count in `packages/alambre` by two primitives, both fully covered by public API contract tests.

---

[← Back to Proposals Index](./index.md)
