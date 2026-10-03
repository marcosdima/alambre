---
title: Discoveries & Pattern Registry
summary: Registry of reusable patterns, OS integrations, UI behaviors, and laboratory experiments observed in app development.
---

# Discoveries & Pattern Registry

Register of reusable patterns, system integration rules, UI behaviors, and kinetic experiments observed across applications (`apps/colguetti`, `apps/cross-logic`, `apps/playground`) and candidate for adoption in `packages/alambre` or `apps/base-template`.

---

## 1. Governance & Double-Signature Lifecycle

Per `docs/agents.md` §5 and `docs/architecture.md` §7, discoveries are governed by strict lifecycle gates to prevent premature abstraction and undocumented drift:

```
[ EXPERIMENT / OBSERVATION ]
             │
             ▼
       ┌───────────┐
       │ PROPOSAL  │ ──> Identified in 1 consumer or in apps/playground. Not public framework API.
       └─────┬─────┘
             │ Second consumer adopts pattern
             ▼
       ┌───────────┐
       │VALIDATING │ ──> Exercised across 2 consumers; candidate abstraction drafted.
       └─────┬─────┘
             │ @integrity audit + contract tests in packages/alambre
             ▼
       ┌───────────┐
       │  ADOPTED  │ ──> Shipped in packages/alambre or apps/base-template; documented in architecture.md / ui.md.
       └───────────┘
```

- **`PROPOSAL`**: Initial discovery logged by an agent or author. Retained in the app/playground until proven reusable.
- **`VALIDATING`**: Adopted by a second consumer to test interface generality without freezing premature abstractions.
- **`ADOPTED`**: Double-signature gate passed. Formally rescued into `alambre` or `base-template`, covered by contract tests, and documented in `architecture.md` or `ui.md`.
- **`REJECTED`**: Experiment concluded negatively (e.g. native OS bug, engine defect, or architectural mismatch). Preserved as **negative knowledge** to prevent regressions.

---

## 2. Catalog Index

| ID | Discovery / Pattern | Layer | Status | Validating Consumers |
|:---|:---|:---|:---:|:---|
| **F-01** | Structured Collection Persistence | `alambre` | `ADOPTED` | Colguetti (items, alarms) |
| **F-02** | Headless History State (`useHistoryState`) | `alambre` | `ADOPTED` | Cross-Logic, generic undo/redo |
| **F-03** | Headless Elapsed Stopwatch (`useStopwatch`) | `alambre` | `ADOPTED` | Cross-Logic, Colguetti (activation) |
| **F-04** | Headless Animation Stagger (`useStagger`) | `alambre` | `ADOPTED` | Cross-Logic, base-template, playground |
| **F-05** | Headless Height Disclosure (`useCollapsible`) | `alambre` | `ADOPTED` | Playground, base-template |
| **F-06** | Headless Drag & Drop (`DndProvider`, `SortableRow`) | `alambre` | `VALIDATING` | Playground (dnd sandbox) |
| **F-07** | Headless Content Carousel (`useCarousel`) | `alambre` | `PROPOSAL` | Colguetti, Playground (carousel testbed) |
| **F-08** | Headless Swipeable Deck (`useDeck`) | `alambre` | `PROPOSAL` | Playground (deck testbed) |
| **F-09** | Headless Physics Hooks vs UI Presentation | `alambre` | `PROPOSAL` | Playground (`CarouselTestbed`, `DeckTestbed`) |
| **OS-01** | Exact Alarms & Battery Doze (`USE_EXACT_ALARM`) | Native / OS | `ADOPTED` | Colguetti 1.0 |
| **OS-02** | Reactive `AppState` Permissions & Resume Sync | Native / OS | `ADOPTED` | Colguetti 1.0 |
| **OS-03** | Edge-to-Edge Android Window (`navigationBarTranslucent`) | Native / OS | `ADOPTED` | Base-template (`AppDialog`, sheets) |
| **UI-01** | Touch Gesture Disambiguation in Swipeable Rows | `base-template` | `ADOPTED` | Colguetti 1.0 (`Alarms.tsx`) |
| **UI-02** | Decoupled Two-Layer Swipe-to-Dismiss | `base-template` | `ADOPTED` | Base-template, playground (`toast`) |
| **UI-03** | Outer Pressable Layout Propagation in Cards | `base-template` | `ADOPTED` | Base-template (`AppCard`, `AppBadge`) |
| **UI-04** | Tactile Micro-Physics (Compression & Snap) | `base-template` | `ADOPTED` | Base-template (`AppButton`, `AppSwitch`) |
| **UI-05** | Single Accessibility Node for Compound Controls | `base-template` | `ADOPTED` | Base-template (`AppSwitch`) |
| **UI-06** | Imperative Focus Chaining in Form Inputs | `base-template` | `ADOPTED` | Base-template (`AppTextInput`) |
| **UI-07** | iOS Drop-Shadow Preservation via Overflow | `base-template` | `ADOPTED` | Base-template (`AppCard`) |
| **UI-08** | Nested Scroll Entrapment Prevention | `base-template` | `ADOPTED` | Base-template, playground |
| **LAB-01** | Tabular Numeral Rollers (`TickerText`) | `playground` | `PROPOSAL` | Playground (text-animations) |
| **LAB-02** | Harmonic Phase Decoupling (`WavyText`) | `playground` | `PROPOSAL` | Playground (text-animations) |
| **LAB-03** | Continuous Numeric Frame Cadence (`CountUpText`) | `playground` | `PROPOSAL` | Playground (text-animations) |
| **LAB-04** | Line Measurement for Seamless Marquee (`MarqueeText`) | `playground` | `PROPOSAL` | Playground (text-animations) |
| **LAB-05** | Staggered Mask Disguise (`DisguiseText`) | `playground` | `PROPOSAL` | Playground (text-animations) |
| **LAB-06** | Declarative Cascade Entrance (`AnimatedCascade`) | `playground` | `PROPOSAL` | Playground (animation-test) |
| **NEG-01** | Fabric Transparent Ghost Text Pre-Layout | Architecture | `REJECTED` | React Native Fabric core defect |
| **NEG-02** | Destructive Confirmations via Transient Toast | Architecture | `REJECTED` | Replaced by `ConfirmProvider` |
| **NEG-03** | Nested Pan Drag Inside Swipeable List Rows | Architecture | `REJECTED` | Responder contention in GestureHandler |
| **KIN-01** | Kinetics Engine (Motion Tokens) | `alambre` | `PROPOSAL` | `packages/alambre/src/core/kinetics.ts`, overlays |
| **AGT-01** | Agent Directives (Bandwidth & File Safety) | `agents` | `PROPOSAL` | Multi-agent coordination (`docs/agents.md`) |
| **AGT-02** | Reanimated Syntax Guardrails | `agents` | `ADOPTED` | Base-template, playground, all Reanimated consumers |

---

## 3. Framework Infrastructure & Headless Behaviors (`packages/alambre`)

### [F-01] Structured Collection Persistence
* **Pattern:** Persisted collections of typed records with add/update/remove, plus JSON get/set helpers over `Storage`.
* **Where it appeared:** `apps/colguetti/src/storage/` and `apps/colguetti/src/items/`.
* **Abstraction:** Additive `Storage.remove` method + `createCollectionProvider({ key, initialRecords })`.
* **Status: ADOPTED.** Shipped in `packages/alambre` (`src/capabilities/collection/`). Validated by Colguetti items and alarms. Covered by `tests/capabilities/collection-provider.test.tsx` and `tests/public-api.test.ts`.

### [F-02] Headless Undo / Redo History State (`useHistoryState`)
* **Pattern:** Stateful experiences (logic puzzles, canvases, editors) require past/present/future stacks with undo/redo capabilities and memory caps.
* **Where it appeared:** `apps/cross-logic/src/domain/history-model.ts` and `apps/cross-logic/src/session/game-context.tsx`.
* **Abstraction:** Pure headless hook `useHistoryState<T>(initialState, options)` and immutable stack helpers (`createHistory`, `pushHistory`, `undoHistory`, `redoHistory`). Decoupled from UI.
* **Status: ADOPTED.** Shipped in `packages/alambre` (`src/hooks/use-history-state.ts`). Validated with unit tests in `packages/alambre/tests/hooks/use-history-state.test.ts`.

### [F-03] Headless Elapsed Time & Stopwatch (`useStopwatch`)
* **Pattern:** Elapsed time tracking, countdowns, and formatted representation across game sessions and routine activation windows.
* **Where it appeared:** `apps/cross-logic/src/session/game-context.tsx` and `apps/colguetti/src/checklist/activation-context.tsx`.
* **Abstraction:** Headless hook `useStopwatch` exposing `{ seconds, isRunning, start, pause, reset, formattedTime }` and helper `formatStopwatchTime`. Presentation is 100% app-owned.
* **Status: ADOPTED.** Shipped in `packages/alambre` (`src/hooks/use-stopwatch.ts`). Validated by `packages/alambre/tests/hooks/use-stopwatch.test.ts`.

### [F-04] Headless Animation Stagger Coordination (`useStagger`)
* **Pattern:** Sequential UI entrances (menus, cards, setting rows) benefit from staggered delays without coupling timing to concrete visual transforms or wrapping views.
* **Where it appeared:** `cross-logic` animation experiments, `base-template` menus, and `playground` test cards.
* **Abstraction:** `calculateStaggerDelay(index, options, isReducedMotion)` + hook `useStagger(options)` + `StaggerProvider`/`useStaggerItem`. Automatically sets delay to `0` when `useReducedMotion()` is active.
* **Status: ADOPTED.** Shipped in `packages/alambre` (`src/hooks/use-stagger.tsx`). Validated by `packages/alambre/tests/hooks/use-stagger.test.tsx`.

### [F-05] Headless Height Disclosure (`useCollapsible`)
* **Pattern:** Animating container height for collapsible sections without layout jumps or clipping bugs caused by Reanimated inability to animate `height: auto`.
* **Where it appeared:** `apps/playground/src/components/AppAccordion.tsx`.
* **Abstraction:** Off-screen zero-opacity measurement probe reading `onLayout`, driving height via `progress.value * measuredHeight` with clamped physics and reduced-motion fallbacks.
* **Status: ADOPTED.** Shipped in `packages/alambre` (`src/hooks/use-collapsible.ts`). Validated by `packages/alambre/tests/hooks/use-collapsible.test.tsx`.

### [F-06] Headless Drag & Drop Primitives (`DndProvider`, `SortableRow`)
* **Pattern:** 60fps pan gestures with screen-relative spatial hit-testing, dynamic neighbor shifting, velocity tilt, and TalkBack/VoiceOver accessibility actions (`moveLeft`/`moveRight`).
* **Where it appeared:** `apps/playground/src/components/dnd/`.
* **Abstraction:** `DndProvider`, `useDraggable`, `useDroppable`, `Draggable`, `Droppable`, `SortableRow`. Decouples spatial tracking and array math from visual design.
* **Status: VALIDATING.** Rescued into `packages/alambre` (`src/components/dnd/`). Covered by unit tests in `packages/alambre/tests/components/`. Awaiting second production consumer before graduation to `ADOPTED`.

### [F-07] Headless Content Carousel (`useCarousel`)
* **Pattern:** Persistent container frames cycling through dynamic children with snapping physics, momentum calculation, wrap-around index calculation, and indicator tracking without remounting outer cards or baking in card styling.
* **Where it appeared:** `apps/colguetti/src/views/home/Home.tsx` (alarms/items carousels) and `apps/playground/src/views/containers/CarouselTestbed.tsx`.
* **Poor-fit assessment:** Tightly coupled monolithic carousel components dictate card layout, sizing, and styling within the framework. This forces consumers (and AI agents) to fight inline styles and causes unnecessary component re-renders during high-frequency gesture updates.
* **Candidate Abstraction:** Headless hook `useCarousel({ cardWidth, cardGap, totalItems, autoPlay, autoPlayInterval })` exposing `{ scrollRef, scrollX, scrollHandler, onMomentumScrollEnd, activeIndex, scrollToIndex, snapInterval }` alongside pure math helpers (`calculateSnapInterval`, `calculateActiveIndex`, `getScrollTargetForIndex`). The visual JSX and layout remain 100% owned by the application.
* **Status: PROPOSAL.** Implemented in `packages/alambre/src/behaviors/carousel/` and tested in `packages/alambre/tests/behaviors/carousel.test.tsx`. Consumed by `CarouselTestbed.tsx`. Awaiting second consumer production adoption, on-device/emulator validation, and sign-off by `@integrity`.

### [F-08] Headless Swipeable Deck (`useDeck`)
* **Pattern:** Stack of swipeable cards with angular kinematics, interactive pan gestures, velocity dismissal, card history stack, and programmatic triggers (swipe left/right, undo, reset) without coupling cards to fixed visual wrappers.
* **Where it appeared:** `apps/playground/src/views/containers/DeckTestbed.tsx`.
* **Poor-fit assessment:** Off-the-shelf deck components bundle card styling, rigid swipe thresholds, and opinionated overlay indicators. This leads to component bloat, prevents custom card rendering, and forces agents to modify library internals for unique visual designs.
* **Candidate Abstraction:** Headless hook `useDeck<T>({ initialCards })` managing stack state, undo history, and gesture shared values: `{ deck, history, activeIndex, swipeTranslation, popCard, undoLast, triggerProgrammaticSwipe, reset }`. Allows the consumer to drive Reanimated card transforms and gestures freely.
* **Status: PROPOSAL.** Implemented in `packages/alambre/src/behaviors/deck/` and covered by unit tests in `packages/alambre/tests/behaviors/deck.test.tsx`. Exercised in `DeckTestbed.tsx`. Awaiting multi-consumer adoption and `@integrity` review.

### [F-09] Headless Physics Hooks vs UI Presentation (Kinetic Containers)
* **Pattern:** Complete architectural decoupling of kinetic physics, layout mathematics, and gesture/scroll coordination from UI presentation markup. Instead of monolithic container components with rigid visual styling, behaviors expose pure mathematical utilities and headless hooks returning reactive SharedValues and native event handlers. The consuming agent or application provides 100% of the JSX and visual styling.
* **Where it appeared:** Container sandboxes in `apps/playground/src/views/containers/` (`CarouselTestbed.tsx`, `DeckTestbed.tsx`) and extraction to `packages/alambre/src/behaviors/` (`carousel/`, `deck/`).
* **Poor-fit assessment:** Monolithic container components in React Native create tight coupling between physics engines (Reanimated, Gesture Handler) and DOM/styling trees. When AI agents (`@ax`, `@ui`) or developers need custom layouts or different design systems, they are forced to fight rigid inline styles or fork entire components. Furthermore, bundling view markup with physics leads to unnecessary re-renders and fragile layout calculations.
* **Candidate Abstraction:** Architecture where `packages/alambre/src/behaviors/` exports pure mathematical calculations (e.g. `calculateSnapInterval`, `calculateActiveIndex`, `getScrollTargetForIndex`) and headless hooks (`useCarousel`, `useDeck`) returning driver refs, SharedValues, and callbacks. Consumers wire these directly into their own `<Animated.ScrollView>` or `<GestureDetector>` hierarchies.
* **Status: PROPOSAL.** Exercised across carousel and deck testbeds in `apps/playground/` and covered by unit tests in `packages/alambre/tests/behaviors/`. Subject to Double-Signature Gate: requires second consumer adoption in production and `@integrity` emulator audit before advancing beyond PROPOSAL.

---

## 4. Mobile OS & Hardware Integrations (Android, iOS)

### [OS-01] Exact Background Alarms & Battery Doze (`USE_EXACT_ALARM`)
* **Pattern:** Background alarms, medication reminders, or critical scheduled alerts failing to fire or delaying by 9–15+ minutes when the device is locked in Android Doze mode.
* **Where it appeared:** `apps/colguetti` Android testing (alarms and post-activation reminders).
* **Technical Analysis:**
  1. On Android 12+ (API 31+), `expo-notifications` requires `android.permission.SCHEDULE_EXACT_ALARM`. On Android 13/14 (API 33+), apps categorized as alarms/reminders must declare `android.permission.USE_EXACT_ALARM`, which is auto-granted at install time.
  2. Without these permissions, `AlarmManager.setAndAllowWhileIdle()` is throttled into OS maintenance windows during Doze.
  3. Notification channels must specify `AndroidImportance.MAX` with `sound: true` and `vibrate: true` to trigger heads-up banners. Channel importance cannot be elevated post-creation on Android, requiring a dedicated channel (`colguetti-alarms`).
  4. Triggers must use exact `DATE` triggers rather than relative time intervals when waking from background.
* **Status: ADOPTED in Colguetti 1.0.** Documented in `docs/project.md` §12.

### [OS-02] Reactive `AppState` Synchronization for System Settings & Resumes
* **Pattern:** When users navigate to Android/iOS Settings via `Linking.openSettings()` to enable permissions or when the app is suspended while timers elapse, the JS runtime does not receive callback events while paused. Returning to the app left stale permission states and frozen countdowns.
* **Where it appeared:** `apps/colguetti/src/notifications/notification-permission-context.tsx` and `apps/colguetti/src/views/home/Home.tsx`.
* **Technical Pattern:**
  1. Subscribe to `AppState.addEventListener('change', (state) => { if (state === 'active') ... })`.
  2. On `'active'`, immediately re-read OS permissions via `getPermissionsAsync()` and synchronize state without requiring an app restart.
  3. Re-evaluate `new Date()` to trigger expiration effects on backgrounded timers immediately upon foregrounding.
* **Status: ADOPTED in Colguetti 1.0.** Pattern identified for `apps/base-template/src/views/settings/Settings.tsx`.

### [OS-03] Edge-to-Edge Android Window (`navigationBarTranslucent`)
* **Pattern:** Bottom sheets and full-height modals on Android displaying an opaque black rectangle behind the system navigation bar when only `statusBarTranslucent` is supplied.
* **Where it appeared:** `apps/playground/src/components/AppActionSheet.tsx` and `AppDialog.tsx`.
* **Technical Pattern:** Supply `navigationBarTranslucent={true}` alongside `statusBarTranslucent={true}` on `<Modal>` to extend the native view hierarchy completely edge-to-edge.
* **Status: ADOPTED in base-template.** Standardized in `AppActionSheet.tsx` and `AppDialog.tsx`.

---

## 5. Application & Compound UI Patterns (`apps/base-template`)

### [UI-01] Touch Gesture Disambiguation in Swipeable Rows
* **Pattern:** Nesting interactive horizontal gestures (such as Pan carousels or horizontal sliders) inside list rows wrapped by `SwipeableItemRow` causes severe responder contention: `Gesture.Pan()` steals horizontal drag events, making swipe-to-delete erratic or impossible.
* **Where it appeared:** `apps/colguetti/src/views/alarms/Alarms.tsx` (`AlarmItemsCarousel`).
* **Technical Solution:**
  1. **Primary rule:** Never nest horizontal Pan gesture listeners inside parent horizontal swipeable containers.
  2. **Static summary with overflow badge:** Display up to $K$ static preview chips (icon + color dot) followed by a `+N` badge indicating remaining elements.
  3. **Alternative:** If interaction is required inside a swipeable row, use discrete tap controls (steppers or arrow chevrons) with bounded `hitSlop`, never drag responders.
* **Status: ADOPTED.** Standardized in `apps/colguetti` (`Alarms.tsx`) and candidate for compound row design in `base-template`.

### [UI-02] Decoupled Two-Layer Swipe-to-Dismiss
* **Pattern:** Transient cards (toasts, banners) combining swipe-to-dismiss gestures with Reanimated unmount animations (`exiting={FadeOut*}`) teleporting back to layout origin `(0, 0)` upon unmount.
* **Where it appeared:** `apps/playground/src/providers/toast.tsx` and `apps/base-template/src/providers/toast.tsx`.
* **Technical Solution:** Decouple into outer layout container (`cardWrapper` with dynamic suppression `isGestureDismissed ? undefined : exitAnimation`) and inner interactive card with clamped opacity (`Extrapolation.CLAMP`).
* **Status: ADOPTED.** Shipped in `apps/base-template/src/providers/toast.tsx`.

### [UI-03] Outer Pressable Layout Propagation in Cards
* **Pattern:** Applying flex styles only to inner animated views while leaving outer `<Pressable>` unstyled causes layout blowouts and overflows on narrow screens.
* **Where it appeared:** `apps/playground/src/components/AppCard.tsx`.
* **Technical Solution:** Forward layout and sizing styles directly to the outer touchable; maintain `width: '100%'` on inner animated view; enforce `flexShrink: 1` on text rows.
* **Status: ADOPTED in base-template.** Shipped in `AppCard.tsx` and `AppBadge.tsx`.

### [UI-04] Tactile Micro-Physics (Compression & Snap)
* **Pattern:** Flat opacity changes feel floaty and unresponsive on physical mobile touchscreens.
* **Where it appeared:** `AppButton.tsx`, `AppSwitch.tsx`, `AppCard.tsx`.
* **Technical Solution:** Rapid compression on press-in (`withTiming(0.96, { duration: 80 })`), tuned elastic snap on release (`withSpring(1, { damping: 15, stiffness: 310 })`), and UI-thread `interpolateColor` morphing.
* **Status: ADOPTED in base-template.** Standardized across all interactive components.

### [UI-05] Single Accessibility Node for Compound Controls
* **Pattern:** Compound switches or checkboxes with labels announce the toggle twice on TalkBack/VoiceOver when both row and switch are accessible.
* **Where it appeared:** `apps/playground/src/components/AppSwitch.tsx`.
* **Technical Solution:** Mark outer row as sole accessible node (`role="switch"`, `accessibilityLabel={label}`, `accessibilityState={{ checked }}`); wrap visual switch track in `pointerEvents="none"` and `accessible={false}`.
* **Status: ADOPTED in base-template.** Shipped in `AppSwitch.tsx`.

### [UI-06] Imperative Focus Chaining in Form Inputs
* **Pattern:** Wrapping `TextInput` in animated styling shells breaks `onSubmitEditing` focus chaining (`nextRef.current?.focus()`).
* **Where it appeared:** `apps/playground/src/components/AppTextInput.tsx`.
* **Technical Solution:** Wrap shell in `React.forwardRef` and expose native methods via `useImperativeHandle(ref, () => innerRef.current)`.
* **Status: ADOPTED in base-template.** Shipped in `AppTextInput.tsx`.

### [UI-07] iOS Drop-Shadow Preservation via Conditional Overflow
* **Pattern:** Setting `overflow: 'hidden'` on iOS views defining `shadow*` properties causes UIKit to clip drop shadows to transparent.
* **Where it appeared:** `apps/playground/src/components/AppCard.tsx`.
* **Technical Solution:** Conditionally set `overflow: variant === 'elevated' ? 'visible' : 'hidden'`.
* **Status: ADOPTED in base-template.** Shipped in `AppCard.tsx`.

### [UI-08] Nested Scroll Entrapment Prevention
* **Pattern:** Embedding `<ScrollView>` inside screen bodies managed by `AppNavigatorBody` causes Android gesture responders to lock prematurely, trapping vertical scroll.
* **Where it appeared:** `apps/playground/src/views/text-animations/TextAnimationsTest.tsx`.
* **Technical Solution:** Screens inside `AppNavigatorBody` must render a root `<View>` layout, allowing outer navigator container to manage momentum and scroll position restoration.
* **Status: ADOPTED in base-template.**

---

## 6. Motion & Kinetic Prototyping (`apps/playground`)

### [LAB-01] Tabular Numeral Rollers (`TickerText`)
* **Pattern:** Animated counters with proportional font metrics jitter horizontally because digits vary in width.
* **Solution:** Apply `fontVariant: ['tabular-nums']` and stacked column strips with right-to-left cascade. Use zero-opacity tabular spacers for digit stabilization.
* **Status: PROPOSAL.** Prototyped and validated in `apps/playground/src/components/text-animations/TickerText.tsx`.

### [LAB-02] Harmonic Phase Decoupling (`WavyText`)
* **Pattern:** Modifying wave amplitude mid-animation causes characters to snap to baseline and resets wave phase.
* **Solution:** Decouple harmonic phase driver (`0 -> 1 -> 0`) from amplitude scaling shared value (`animAmplitude`).
* **Status: PROPOSAL.** Prototyped and validated in `apps/playground/src/components/text-animations/WavyText.tsx`.

### [LAB-03] Continuous Numeric Frame Cadence (`CountUpText`)
* **Pattern:** High-frequency numeric shifts (currency, exp) create excess view hierarchy when built with column reels.
* **Solution:** Drive interpolation on `requestAnimationFrame` with cubic ease-out curves and static accessibility labels announcing the settled target.
* **Status: PROPOSAL.** Prototyped in `apps/playground/src/components/text-animations/CountUpText.tsx`.

### [LAB-04] Line Measurement for Seamless Marquee (`MarqueeText`)
* **Pattern:** Android Yoga clamps large negative coordinates and native `TextView` ellipses text mid-scroll.
* **Solution:** Off-screen `<ScrollView horizontal>` probe reading true unconstrained width + setting `width: effectiveTextWidth` and `ellipsizeMode="clip"`.
* **Status: PROPOSAL.** Prototyped in `apps/playground/src/components/text-animations/MarqueeText.tsx`.

### [LAB-05] Staggered Mask Disguise (`DisguiseText`)
* **Pattern:** Binary password/token reveal lacks tactile feedback.
* **Solution:** Staggered per-character gravity drop or in-place rotation morph honoring `useReducedMotion()`.
* **Status: PROPOSAL.** Prototyped in `apps/playground/src/components/text-animations/DisguiseText.tsx`.

### [LAB-06] Declarative Cascade Entrance (`AnimatedCascade`)
* **Pattern:** Manual wiring of sequential entrance delays (`index * staggerMs`) across menus and lists produces boilerplate.
* **Solution:** Composition wrapper over `useStagger` applying parameterized entrance transitions to `Children.toArray`. (Note: Accordions must not be nested inside cascade springs).
* **Status: PROPOSAL.** Prototyped in `apps/playground/src/components/AnimatedCascade.tsx`.

---

## 7. Architectural Anti-Patterns & Negative Knowledge

### [NEG-01] Fabric Transparent Ghost Text Pre-Layout (REJECTED)
* **Attempted hack:** Rendering unrevealed typewriter text inside `<Text style={{ color: 'transparent' }}>` to pre-calculate line breaks and prevent Knuth-Plass retro-balancing.
* **Core engine failure:** In React Native Fabric (and Android `ForegroundColorSpan`), `'transparent'` normalizes to `0x00000000` (`0`). In React Native C++ core (`HostPlatformColor.h`), `UndefinedColor = 0`. The wrapper `SharedColor(0)` evaluates `operator bool()` as `false`. `TextAttributes::apply` discards it and falls back to parent foreground color. The text renders 100% opaque.
* **Correct pattern:** Use `textBreakStrategy="simple"` with progressive string slicing (`text.slice(0, N)`) and container `minHeight`.

### [NEG-02] Destructive Confirmations via Transient Toast (REJECTED)
* **Attempted design:** Using toast notification action buttons for destructive operations (e.g. "Eliminar ítem").
* **UX/Architecture mismatch:** A destructive confirmation is a blocking modal decision requiring explicit user consent. A toast is a transient, non-modal, auto-dismissing affordance.
* **Adopted solution:** Shipped `ConfirmProvider` / `useConfirm` behavior in `packages/alambre`.

### [NEG-03] Nested Pan Drag Inside Swipeable List Rows (REJECTED)
* **Attempted design:** Hosting a touch-draggable carousel inside an item card wrapped by `SwipeableItemRow`.
* **GestureHandler failure:** Both handlers compete for horizontal pan gestures. The inner gesture either steals the swipe completely (user cannot reveal delete action) or locks up dragging entirely.
* **Adopted solution:** Static item preview with `+N` badge or non-gesture stepper controls.

---

## 8. Kinetics Engine & Agent Directives

### [KIN-01] Kinetics Engine (Motion Tokens)
* **Pattern:** Centralization of physical animation parameters (springs, timings, frictions) into standardized framework motion tokens rather than scattered ad-hoc physics across UI components.
* **Where it appeared:** `packages/alambre/src/core/kinetics.ts` (consumed across `useBottomSheet`, `useDialog`, `useSwipeableRow`, `useWheelPicker`, `Slider`).
* **Poor-fit assessment:** Component-level hardcoded spring configurations (`damping`, `mass`, `stiffness`) cause fragmented tactile feel across the app ecosystem and force agents to duplicate or guess physics parameters.
* **Candidate Abstraction:** Centralized tokens in `packages/alambre/src/core/kinetics.ts` (`springSnappy`, `springBouncy`, `springGentle`, `rubberBandFriction`, or token namespace `kinetics.spring.bouncy`). Agents must use these tokens instead of hardcoding `damping` and `stiffness` in components.
* **Status: PROPOSAL.** Centralized in `packages/alambre/src/core/kinetics.ts`. Pending second consumer validation across all production surfaces and `@integrity` sign-off for full formal adoption.

### [AGT-01] Agent Directives (Bandwidth & File Safety)
* **Pattern:** Multi-agent operational rules for communication bandwidth conservation and file tool safety across repo workflows.
* **Where it appeared:** Multi-agent execution sessions and coordination protocol (`docs/agents.md`).
* **Poor-fit assessment:** Non-English communication causes unnecessary token bloat and exhausts context limits. Using `cat` in bash to create or append files echoes full contents to stdout, polluting the context window and risking escaping corruption.
* **Candidate Abstraction / Rule:**
  1. **Token Bandwidth:** Agents must communicate in English to save token bandwidth.
  2. **File Tool Safety (CRITICAL INSTRUCTION 1):** Agents must strictly adhere to CRITICAL INSTRUCTION 1: never use `cat` in bash to create/append files as it pollutes the context window. Use structured file editing tools (`replace_file_content` or dedicated file write utilities) instead.
* **Status: PROPOSAL.** Documented as an architectural discovery for agent workflow governance; pending formal adoption into `docs/agents.md` §5 anti-drift guardrails.

### [AGT-02] Reanimated Syntax Guardrails
* **Pattern:** LLM Agents often hallucinate Reanimated syntax by attempting to interpolate `withSpring()` or `withTiming()` directly (e.g., `interpolate(withSpring(value), ...)`). This returns an animation object, not a number, resulting in `NaN` and completely invisible UI components.
* **Rule:** Never interpolate `withSpring` or `withTiming` directly. You must either apply them directly to the style property (`{ width: withSpring(...) }`), or use `useDerivedValue` to create an animatable number that can be interpolated (`const progress = useDerivedValue(() => withSpring(value)); interpolate(progress.value, ...)`).
* **Status: ADOPTED.** Mandatory syntax guardrail across all agent workflows and Reanimated consumers (`base-template`, `apps/playground`, `packages/alambre`).
