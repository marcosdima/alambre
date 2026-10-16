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

## Proposal 3: Retiring the `TimePicker` Presentation Exception into Headless Wheel Physics (`useWheelPicker`)

### 1. Current Problem
- `TimePicker` is explicitly documented in `docs/framework/ui-decisions.md` §2 as a **"provisional presentation exception"**: arrow glyphs ('▲', '▼'), typography, dimensions, inactive label colors, and default accent `#0057d8` are hardcoded in `alambre`.
- In practice, the reference application (`apps/colguetti`) completely rejected `alambre.TimePicker` and built `SwipeableTimePicker.tsx` (329 LOC) with Reanimated gestures, inertia flick momentum, and multi-cycle infinite scrolling.
- Consequently, `TimePicker` is dead weight in `alambre`: imported by zero apps in the monorepo.

### 2. Proposed Solution
1. Extract the kinetic wheel physics into a headless hook:
   - **`useWheelPicker({ itemCount, selected, onSelect, rowHeight })`**:
     - UI-thread Reanimated shared values (`currentPosition`, `dragStartPos`).
     - Combined `Gesture.Pan()` with velocity inertia flicking and `Gesture.Tap()` for instant step selection.
     - Smooth spring settling (`withSpring`) and cyclic wrapping math (`((val % count) + count) % count`).
2. Retain pure time math helpers: `parseTimeValue`, `formatTimeValue`, `HOUR_RANGE`, `MINUTE_RANGE`.
3. Provide an optional presentation-neutral compound component:
   - `<WheelPicker.Root>`, `<WheelPicker.Column>`, `<WheelPicker.Item>`.
4. Migrate `apps/colguetti/src/components/SwipeableTimePicker.tsx` to consume `useWheelPicker`, proving reuse and eliminating the provisional exception from `docs/framework/ui-decisions.md` §2.

### 3. Pros & Cons
- **Pros:**
  - Eliminates the only remaining hardcoded presentation exception in `alambre` (`ui.md` §2).
  - Generalizes wheel scrolling for hours, minutes, dates, pickers, and numeric counters.
  - Reconciles framework with actual app adoption in Colguetti.
- **Cons:**
  - Breaking change for the existing `TimePicker` component (permitted under pre-baseline `architecture.md` §9).

---

## Proposal 4: First-Class Type Safety & State Modernization (`createConfig`, `useNavigator`, `NavigatorTypes`)

### 1. Current Problem
- **`createConfig` forced string values:** `ConfigState<T extends Record<string, string>>` forces all config keys and values to be `string`. Applications cannot store booleans (`notificationsEnabled: boolean`), numbers (`refreshInterval: number`), or objects without manual serialization. `saveField` accepts `value: string` instead of `value: T[K]`. Furthermore, it lacks a `loading` / `hydrated` indicator, risking flash of unhydrated content.
- **Legacy Namespace Leakage (`NavigatorTypes`):** `NavigatorTypes` is the only remaining subsystem exported as a blanket `export * as NavigatorTypes` namespace from `types/index.ts` (violating `architecture.md` §8 and audit checklist item 1).
- **Untyped Routing in `useNavigator`:** Route keys and targets are untyped `string`. Calling `navigate('nonExistent')` fails silently or causes runtime errors without TypeScript compile-time feedback. There is no first-class contract for route parameters (forcing applications to create ad-hoc contexts like `RouteIntent`).
- **`createLang` loose type:** `Langs = Record<string, object>` types translation objects as `object`, losing type safety on translated strings unless cast manually.

### 2. Proposed Solution
1. **Modernize `createConfig`:**
   - Expand to `T extends Record<string, any>`, supporting booleans, numbers, and objects.
   - Strictly type `saveField<K extends keyof T>(field: K, value: T[K])`.
   - Expose `loading: boolean` or `hydrated: boolean` in `useConfig` to match `createCollection`.
2. **Dismantle `NavigatorTypes` Namespace:**
   - Export first-class public types in `src/index.ts`: `Page`, `NavigatorObject`, `NavigatorReturn`, `NavigatorProviderProps`, `NavigationSettings`.
3. **Type-Safe Routing & Route Parameters:**
   - Parameterize `useNavigator<TRoutes>`: `navigate<K extends keyof TRoutes>(route: K, params?: TRoutes[K])`.
   - Support optional route intent / parameter passing directly through navigation actions.
4. **Strict `createLang` Translation Generics:**
   - Allow `createLang<T extends Record<string, L>, L extends Record<string, any>>` to preserve dictionary intellisense.

### 3. Pros & Cons
- **Pros:**
  - Zero runtime overhead; eliminates TypeScript strictness leaks.
  - Resolves the last lingering blanket namespace export in `architecture.md` §8.
  - Gives complete autocomplete and compile-time validation for app navigation and configuration.
- **Cons:**
  - Tightening types may require minor type annotations in existing app providers.

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


