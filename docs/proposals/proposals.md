---
title: Architectural Proposals & Technical Roadmap
summary: High-impact proposals to modernize alambre with compound components, headless overlay utilities, strict typing, and technical debt remediation.
---

# Architectural Proposals & Technical Roadmap

This document captures high-impact architectural improvements for `alambre` discovered during the comprehensive codebase audit. Each proposal addresses demonstrated friction, code duplication, or type-safety limitations across `packages/alambre` and consumer apps (`apps/colguetti`, `apps/base-template`, `apps/playground`, `apps/cross-logic`).

---

## Proposal 1: Headless Modal & Bottom Sheet Primitives (`useDialog`, `useBottomSheet`) [RESOLVED]

### Status: RESOLVED
- Shipped headless overlay behaviors `useBottomSheet` and `useDialog`, along with compound overlay components `BottomSheet` and `Dialog` in `packages/alambre/src/behaviors/overlays/`.
- Exported from `packages/alambre/src/index.ts` and validated with contract tests.
- Consumed across apps and showcase components.

### 1. Current Problem
- `AppActionSheet.tsx` (413 lines) and `AppDialog.tsx` (318 lines) are copied verbatim across `apps/colguetti`, `apps/base-template`, and `apps/playground`—representing over **1,400 lines of duplicated code**.
- Both components implement intricate Reanimated worklets (spring physics, backdrop fade interpolation, overshoot skirt, drag-to-dismiss velocity thresholds) and mobile OS quirks (`statusBarTranslucent`, `navigationBarTranslucent`, `KeyboardAvoidingView` offsets).
- `ConfirmHost` and `ToastHost` are headless overlay hosts in `alambre`, but `alambre` offers no primitives for modal dialogs or bottom sheets, forcing every application to re-engineer gesture physics from scratch.

### 2. Proposed Solution
Extract pure headless overlay behaviors into `packages/alambre/src/behaviors/` or `src/components/`:
1. **`useBottomSheet(options)`**:
   - Manages Pan drag-to-dismiss gesture, UI-thread `translateY` shared value, backdrop opacity interpolation (`0 -> 1`), overshoot resistance math, and settle velocity thresholds.
   - Exposes: `{ panGesture, translateY, backdropOpacity, close, snapTo, isMounted }`.
   - Optional compound wrapper: `<BottomSheet.Root>`, `<BottomSheet.Backdrop>`, `<BottomSheet.Handle>`, `<BottomSheet.Content>`.
2. **`useDialog(options)`**:
   - Manages scale/fade spring transitions (`cardScale: 0.92 -> 1`, `backdropOpacity: 0 -> 1`), accessible backdrop press handling, and accessibility bindings (`role="alert"` / `role="dialog"`).
   - Exposes: `{ isMounted, animatedBackdropStyle, animatedCardStyle, close }`.
3. Application layer (`AppActionSheet`, `AppDialog` in `base-template` and apps) becomes a thin presentation shell (~45 LOC) styling colors, typography, and badges.

### 3. Pros & Cons
- **Pros:**
  - Eliminates >1,400 LOC of duplicated Reanimated gesture logic across apps.
  - Standardizes Android edge-to-edge windowing (`navigationBarTranslucent`) and swipe-to-dismiss physics across the ecosystem.
  - Directly powers `ConfirmHost` and action menus with uniform physics.
- **Cons:**
  - Requires maintaining gesture dependencies (`react-native-gesture-handler`) in overlay contracts.

---

## Proposal 2: Compound Form Primitives & Focus Chaining Architecture (`Input`, `Stepper`, `Slider`) [RESOLVED]

### Status: RESOLVED
- Shipped compound form components `Input` (`Root`, `Field`, `Label`, `Affix`, `ClearButton`, `PasswordToggle`, `Feedback`), `Stepper` (`Root`, `Decrement`, `Value`, `Increment`), and `Slider` (`Root`, `Track`, `Range`, `Thumb`) in `packages/alambre/src/components/base/`.
- Native `forwardRef` enabled for seamless focus chaining.
- Exported in `src/index.ts` and covered by unit/contract tests.

### 1. Current Problem
- **Broken Focus Chaining:** `Input.tsx` does not forward native refs via `React.forwardRef`. This breaks `onSubmitEditing` focus chaining (`nextRef.current?.focus()`; see `docs/framework/ui-decisions.md` §8). Because of this, every app (`colguetti`, `base-template`, `playground`) completely abandoned `alambre.Input` and wrote a custom 412 LOC `AppTextInput.tsx` directly over RN's `TextInput`.
- **Lack of Slots:** Form inputs regularly need labels, leading/trailing icons, clear buttons, password visibility toggles, and validation error messages. `alambre.Input` is a bare `RNTextInput` wrapper without any of these capabilities.
- **Monolithic Render-Props in `Stepper` and `Slider`:** Both components force consumers into a single monolithic callback (`children(state)`), requiring consumers to manually wire decrement buttons, value textboxes, increment buttons, tracks, and thumbs from scratch.

### 2. Proposed Solution
Evolve form inputs into accessible, ref-forwarding **Compound Components**:
1. **`Input` Compound Family:**
   - `<Input.Root>`: Context holder managing `focused`, `disabled`, `error`, `hasValue`.
   - `<Input.Field ref={ref}>`: Ref-forwarded native text field with focus/blur tracking.
   - `<Input.Label>`: Accessible label associated via accessibility contracts.
   - `<Input.Affix>` / `<Input.ClearButton>` / `<Input.PasswordToggle>`: Standardized slots for interactive decorations.
   - `<Input.Feedback>`: Accessible validation error or helper text (`aria-invalid`, `role="alert"`).
2. **`Stepper` Compound Family:**
   - `<Stepper.Root min={0} max={10} value={val} onChange={setVal}>`
   - `<Stepper.Decrement>` (auto-disabled at min), `<Stepper.Value format={fn}>`, `<Stepper.Increment>` (auto-disabled at max).
3. **`Slider` Compound Family:**
   - `<Slider.Root>`: Coordinates touch responder layout bounds and step snapping.
   - `<Slider.Track>`, `<Slider.Range>` (active fill), `<Slider.Thumb>`.

### 3. Pros & Cons
- **Pros:**
  - Enables clean declarative composition without cumbersome render-prop boilerplate.
  - Automatically satisfies accessibility contracts (`role="spinbutton"`, `role="adjustable"`, `aria-invalid`).
  - Resolves the focus-chaining trap (`docs/framework/ui-decisions.md` §8) and allows `AppTextInput` in all apps to wrap `alambre.Input` instead of bypassing it.
- **Cons:**
  - Slightly larger public component surface (requires exporting subcomponents on the parent namespace).

---

## Proposal 3: Retiring the `TimePicker` Presentation Exception into Headless Wheel Physics (`useWheelPicker`) [RESOLVED]

### Status: RESOLVED
- Shipped headless wheel picker physics hook `useWheelPicker` in `packages/alambre/src/behaviors/wheel/useWheelPicker.ts`.
- Shipped presentation-neutral picker component `HorizontalPicker` in `packages/alambre/src/components/base/input/picker/HorizontalPicker.tsx`.
- Formally retired the provisional hardcoded `TimePicker` component from the public framework API, eliminating the presentation exception documented in `docs/framework/architecture.md` §6 and §8.
- Validated via unit/contract tests and exported top-level from `packages/alambre/src/index.ts`.

### 1. Current Problem
- `TimePicker` was explicitly documented in `docs/framework/ui-decisions.md` §2 as a **"provisional presentation exception"**: arrow glyphs ('▲', '▼'), typography, dimensions, inactive label colors, and default accent `#0057d8` were hardcoded in `alambre`.
- In practice, consumer applications rejected `alambre.TimePicker` in favor of gesture-driven inertia scrolling.
- Consequently, `TimePicker` was dead weight in `alambre`.

### 2. Proposed Solution
1. Extract the kinetic wheel physics into a headless hook:
   - **`useWheelPicker({ itemCount, selected, onSelect, rowHeight })`**:
     - UI-thread Reanimated shared values (`currentPosition`, `dragStartPos`).
     - Combined `Gesture.Pan()` with velocity inertia flicking and `Gesture.Tap()` for instant step selection.
     - Smooth spring settling (`withSpring`) and cyclic wrapping math (`((val % count) + count) % count`).
2. Retain pure time math helpers: `parseTimeValue`, `formatTimeValue`, `HOUR_RANGE`, `MINUTE_RANGE`.
3. Provide an optional presentation-neutral compound component:
   - `<WheelPicker.Root>`, `<WheelPicker.Column>`, `<WheelPicker.Item>` / `HorizontalPicker`.
4. Eliminate the provisional exception from `docs/framework/ui-decisions.md` §2.

### 3. Pros & Cons
- **Pros:**
  - Eliminates the only remaining hardcoded presentation exception in `alambre` (`ui.md` §2).
  - Generalizes wheel scrolling for hours, minutes, dates, pickers, and numeric counters.
- **Cons:**
  - Breaking change for the existing `TimePicker` component (permitted under pre-baseline `architecture.md` §9).

---

## Proposal 4: First-Class Type Safety & State Modernization (`createConfig`, `useNavigator`, `createLang`) [RESOLVED]

### Status: RESOLVED
- Modernized `createConfig` with generic typing (`T extends Record<string, unknown>`), typed `saveField<K extends keyof T>`, automatic JSON serialization for booleans/numbers/objects, and exposed `loading: boolean` state.
- Dismantled legacy blanket namespace export `NavigatorTypes`, directly exporting `Page`, `NavigatorObject`, `NavigatorReturn`, `NavigatorProviderProps`, and `NavigationSettings` from `packages/alambre/src/index.ts`.
- Parameterized `useNavigator<TRoute, TSubpage, TParams>` to support type-safe route names, subpages, and navigation parameters.
- Upgraded `createLang` with generic dictionary inference (`<T extends Record<string, L>, L extends LangDictionary = T[keyof T]>`) and exported `LangDictionary`, `Langs`, `LangState`, `UseLangType`, and `CreateLangReturn` in `packages/alambre/src/index.ts`, preserving dictionary intellisense across apps without manual type assertions.
- Contract-tested in `packages/alambre/tests/public-api.test.ts` and `packages/alambre/tests/capabilities/create-lang.test.tsx`.

### 1. Current Problem
- **`createConfig` forced string values:** `ConfigState<T extends Record<string, string>>` forced all config keys and values to be `string`. Applications could not store booleans, numbers, or objects without manual serialization. `saveField` accepted `value: string` instead of `value: T[K]`. Furthermore, it lacked a `loading` indicator.
- **Legacy Namespace Leakage (`NavigatorTypes`):** `NavigatorTypes` was exported as a blanket `export * as NavigatorTypes` namespace from `types/index.ts`.
- **Untyped Routing in `useNavigator`:** Route keys and targets were untyped `string`.
- **`createLang` loose type:** `Langs = Record<string, object>` typed translation objects as `object`, losing type safety on translated strings unless cast manually.

### 2. Proposed Solution
1. **Modernize `createConfig`:**
   - Expand to `T extends Record<string, unknown>`, supporting booleans, numbers, and objects.
   - Strictly type `saveField<K extends keyof T>(field: K, value: T[K])`.
   - Expose `loading: boolean` in `useConfig`.
2. **Dismantle `NavigatorTypes` Namespace:**
   - Export first-class public types in `src/index.ts`: `Page`, `NavigatorObject`, `NavigatorReturn`, `NavigatorProviderProps`, `NavigationSettings`.
3. **Type-Safe Routing & Route Parameters:**
   - Parameterize `useNavigator<TRoutes>`: `navigate<K extends keyof TRoutes>(route: K, params?: TRoutes[K])`.
   - Support optional route parameters through navigation actions.
4. **Strict `createLang` Translation Generics:**
   - Allow `createLang<T extends Record<string, L>, L extends Record<string, any>>` to preserve dictionary intellisense.

### 3. Pros & Cons
- **Pros:**
  - Zero runtime overhead; eliminates TypeScript strictness leaks.
  - Resolves the last lingering blanket namespace export in `architecture.md` §8.
  - Gives complete autocomplete and compile-time validation for app navigation and configuration.
- **Cons:**
  - None; fully backward-compatible with optional generics.


---

## Proposal 5: Formalizing the Headless Swipe-to-Action Primitive (`useSwipeableRow`) [RESOLVED]

### Status: RESOLVED
- Shipped in `packages/alambre/src/hooks/use-swipeable-row.ts`.
- Exported in `src/index.ts` and covered by contract tests in `packages/alambre/tests/hooks/use-swipeable-row.test.ts`.
- Documented in `docs/reference/hooks.md`.

---

## Proposal 6: Traveling Wavefront & Kinetic Orchestration Architecture (`useWavefront`, `calculateWavefrontPhase`) [RESOLVED]

### Status: RESOLVED
- Shipped headless wavefront orchestrator `useWavefront` (with alias `useKineticOrchestrator`) in `packages/alambre/src/hooks/use-wavefront.ts`.
- Added closed-form analytical curves (`criticallyDampedCurve`, `bouncyCurve`, `cubicEaseOutCurve`, `polynomialOvershootCurve`), traveling wave worklet `calculateWavefrontPhase`, Apple-style duration springs, and frame-budgeted stagger windowing in `packages/alambre/src/core/kinetics.ts` and `packages/alambre/src/hooks/use-stagger.tsx`.
- Optimized `@alambre/ui` components (`AnimatedCascade`, `WavyText`, `CountUpText`) to eliminate $N$-ODE spring concurrency overload and layout thrashing.
- Contract-tested and verified with testbed in `apps/playground/src/views/kinetics/KineticOrchestratorTestbed.tsx`.

### 1. Current Problem
- **$N$-ODE Spring Concurrency Overload:** When cascading or staggering entering animations across $N$ list items or tags, each child running `withSpring()` creates an active C++ numerical ODE step solver in Reanimated on the UI thread. With 30–50 items, this saturated the frame budget (4–6ms/frame on 120Hz displays), triggering frame drops and touch latency.
- **Layout Thrashing Cascade:** `AnimatedCascade` paired staggered entries with `LinearTransition.springify()`. When mounting $N$ items sequentially, every mount triggered a layout cascade update across all preceding siblings, causing an $O(N^2)$ Yoga layout calculation storm on the UI thread.
- **Micro-Timer Thread Flooding:** Infinite text animations (`WavyText`) spun up $N$ separate timers and $2N$ shared values, competing with gesture responders for UI thread cycles.

### 2. Proposed Solution
1. **Mathematical Closed-Form Traveling Wavefront:**
   - Coordinate $N$ items with a single master progress clock ($\tau \in [0, 1]$) driven by timing or spring.
   - Partition phase on the UI thread analytically:
     $$\phi_i(\tau) = \operatorname{clamp}\left( \frac{\tau \cdot T_{\text{total}} - i \cdot \Delta t}{D}, 0, 1 \right)$$
   - Evaluate closed-form analytical transfer functions (Critically Damped, Bouncy, Overshoot, Cubic) in scalar worklets, eliminating $N$ concurrent numerical ODE integrators.
2. **Paced Stagger Windowing:**
   - In `useStagger`, provide batch windowing (`batchSize`, `batchIntervalMs`) via `calculateBudgetedStaggerDelay` to prevent scheduling spikes.
3. **GPU-Accelerated Cascade:**
   - Ensure staggered entrances run purely on GPU-backed transforms (`transform`, `opacity`) without invoking Yoga layout transitions during initial waterfall mounting.
4. **Single-Clock Harmonic Text:**
   - Refactor looping text animations to a single UI-thread periodic clock evaluated with harmonic wave functions (`wrapPhase`, `harmonicValue`).

### 3. Pros & Cons
- **Pros:**
  - Reduces CPU footprint of staggered animations from $O(N)$ active ODE solvers to $O(1)$ master clock with zero frame drops.
  - 100% backward compatible: preserves existing `kinetics` spring and timing definitions while adding duration springs and analytical curves.
  - Completely eliminates initial layout thrashing in cascade lists.
- **Cons:**
  - Closed-form curves assume monotonic progress $\tau \in [0, 1]$; highly dynamic runtime interruption mid-wave requires driving $\tau$ with a master spring.

---

## Proposal 7: Declarative Wavefront Orchestration & Headless Tactile Kinetics (`WavefrontProvider`, `useWavefrontItem`, `usePressKinetics`) [RESOLVED]

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

## Proposal 8: Spatial & Flight Kinetics (`useFlightTrajectory`, `useSpatialFlip`, and `calculateHandFan`)
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

## Proposal 9: Kinetic Containers & Dual-Gesture Swipe (`useKineticSwipe` and `useKineticCarousel`)
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

## Proposal 10: Headless Ephemeral Room Relay (`@alambre/room-relay`)
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

## Proposal 11: Headless Kinetic Pipeline & Multi-Track Choreography (`useKineticPipeline`, `useKineticChoreography`, `trajectory.ts`, `handoff.ts`)
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

## Proposal 12: Headless Spatial Coordinate Space, Target Registry & Toss Physics (`SpatialSpace`, `useSpatialTarget`, `useSpatialToss`)
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

## Proposal 13: UI-Thread Cascading Deal & Unified Interactive Hand (`useCascadeFlight`, `useInteractiveHand`)
- **Status**: RESOLVED (Implemented in `packages/alambre` — `computeSpatialCascadePlan` / `computeDealCascadePlan`, `calculateResponsiveHandFan`, `useCascadeFlight` / `useDealCascade`, UI-thread `useCascadeFlightItem`, `reorderHandItems`, `resolveHandReorderIndex`, and `useInteractiveHand`)
- **Author**: @lead

### 1. Current Problem
- **JS Timer Stagger Drift in Dealing:** `CascadeFlightItem.tsx` in `apps/playground` schedules sequential card deal launches using JavaScript `setTimeout(..., spec.startDelayMs)`. Under JS bridge traffic (e.g. multiplayer message processing or state updates), `setTimeout` introduces frame-pacing jitter compared to UI-thread animation delays.
- **Single-Mode Hand Interaction:** `CardHand.tsx` only supports single-card tap selection (`selectedCardId: string | null`) and upward swipe-to-play (`useKineticSwipe` with `directions: ['up']`). Production card games require:
  1. **Horizontal Drag-to-Reorder:** Dragging a card left/right along the curved hand fan to reorganize a hand, with neighboring cards smoothly shifting via spring physics to preview the new slot.
  2. **Seamless Drag-Out-to-Play Handoff:** Continuing that same drag upward past an escape threshold (or releasing over a table drop zone) to transition from hand reordering into a table play/toss without lifting the finger.
  3. **Multi-Card Combo Selection:** Selecting multiple cards simultaneously (pairs, straights, melds, or batch discards) with coordinated fan lift and batch play trajectories.

### 2. Proposed Solution
1. **UI-Thread Cascade Orchestrator (`computeSpatialCascadePlan<T>`, `useCascadeFlight<T>`):**
   - Promote generic `computeDealCascadePlan` and `calculateResponsiveHandFan` into `packages/alambre`.
   - Drive staggered flight delays natively on the Reanimated UI thread (`withDelay`) rather than JS `setTimeout`, exposing per-item landing callbacks (`onItemLanded`) and batch completion (`onCascadeComplete`).
2. **Headless Interactive Hand Hook (`useInteractiveHand<T>`):**
   - Manages ordered item state, single or multi-select sets (`selectionMode: 'single' | 'multiple'`, `maxSelected`), and responsive fan slot transforms.
   - Unified 2D pan gesture per item:
     - When `|translationY| < escapeThresholdY`: computes active hover slot index along the fan arc and shifts sibling slots in real time on the UI thread.
     - When `translationY < -escapeThresholdY`: exits reorder mode and hands off to free 2D drag/toss toward table drop zones.

### 3. Pros & Cons
- **Pros:**
  - Delivers AAA mobile card-game feel (Hearthstone / Balatro / Marvel Snap style in-hand sorting + drag-to-play + multi-card combos) as a reusable headless primitive.
  - Zero JS timer drift during rapid multi-card dealing.
- **Cons:**
  - Requires careful gesture arbitration on small screens so horizontal fan dragging and vertical pull-out transitions feel predictable.

---

## Proposal 14: Deterministic Turn Engine, Seeded PRNG & State Snapshots (`@alambre/room-relay`)
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

## Proposal 15: Headless Sensory Cues & Tactile Audio/Haptic Contract (`createSensoryCues`, `useSensoryFeedback`)
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

## Proposal 16: `@alambre/ui` Consolidation, `ThemeProvider` Unification & Hygiene
- **Status**: RESOLVED (Implemented across `packages/ui`, `apps/playground`, `README.md`, `docs/guidelines/agents.md`, and `scripts/e2e.sh`)
- **Author**: @lead

### 1. Current Problem
- **UI Component Duplication in `apps/playground`:** `apps/playground/src/components/` still maintains local copies of `AppButton.tsx`, `AppCard.tsx`, `AppBadge.tsx`, `AppSegmentedControl.tsx`, `AppSlider.tsx`, and `AppTitle.tsx` that duplicate `@alambre/ui`. This occurred because `apps/playground/src/navigator/Root.tsx` does not wrap its tree in `@alambre/ui`'s `<ThemeProvider theme={theme}>` (unlike `apps/base-template`).
- **Kinetic Drift Between `playground` and `@alambre/ui`:** In Proposal 7, `apps/playground`'s local `AppButton` and `AppCard` were refactored to consume `usePressKinetics`, but `packages/ui/src/components/AppButton.tsx` and `AppCard.tsx` still use legacy manual `useSharedValue(1)` + `withTiming`/`withSpring` boilerplate.
- **Missing Test Runner in `@alambre/ui` & Stale Archive References:** `packages/ui/package.json` has `lint` and `typecheck` scripts but no `test` script or contract tests. Additionally, `README.md`, `docs/guidelines/agents.md`, and `scripts/e2e.sh` still contain references to archived apps (`apps/colguetti`, `apps/cross-logic`).

### 2. Proposed Solution
1. **Upgrade `@alambre/ui` Primitives:** Refactor `packages/ui/src/components/AppButton.tsx` and `AppCard.tsx` to consume `usePressKinetics` from `alambre`.
2. **Unify `apps/playground` on `@alambre/ui`:** Mount `<ThemeProvider theme={theme}>` in `apps/playground/src/navigator/Root.tsx`, re-point playground imports to `@alambre/ui`, and deduplicate `apps/playground/src/components/App*.tsx` files into thin re-exports of `@alambre/ui`.
3. **Clean Stale Docs:** Update documentation/scripts to reflect active workspace apps (`base-template`, `playground`, and the upcoming card game app).

### 3. Pros & Cons
- **Pros:**
  - Ensures the upcoming Card Game app consumes a single, battle-tested `@alambre/ui` package with `usePressKinetics` already integrated.
  - Eliminates ~1,300 lines of duplicated UI wrapper code in `apps/playground`.
- **Cons:**
  - Requires a quick visual/test pass across `apps/playground` views after switching imports to `@alambre/ui`.

