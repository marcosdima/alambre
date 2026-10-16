---
title: Architecture
summary: Architectural principles, boundaries, and the public type contract of alambre.
---

# Architecture

This document defines the architectural principles and boundaries of `alambre`.

The architecture is intentionally evolving. Current implementation details, experiments, and unvalidated abstractions should not be considered architectural decisions unless explicitly adopted.

---

## 1. Purpose

`alambre` is a reusable framework for React Native applications.

Its purpose is to provide reusable infrastructure, behavior, and contracts for problems that are likely to recur across applications.

Alambre is not intended to:

* replace React Native
* compete with mature ecosystem solutions
* become an exhaustive UI library
* become a complete design system
* introduce abstractions merely for the sake of abstraction

---

## 2. Framework and application boundary

The fundamental boundary is:

> **Alambre provides reusable functionality, behavior, contracts, and infrastructure. The application provides presentation, identity, and product-specific decisions.**

Alambre should solve problems that are genuinely reusable across applications.

Application-specific decisions should remain in the application whenever they do not need to be centralized.

This distinction is especially important for UI, where reusable behavior should be separated from application-specific presentation.

---

## 3. Abstraction criteria

An abstraction should be introduced when it solves a recurring problem that is valuable to centralize.

The guiding question is:

> Does this solve a repetitive behavior or infrastructure problem worth centralizing?

If clearly yes, it is a candidate for Alambre.

If uncertain, prototype it at the application level first.

If the concept itself is not yet clear, do not freeze the abstraction prematurely.

---

## 4. Architectural flexibility

Alambre capabilities do not need to share a single internal architecture.

Different problems justify different approaches:

* **Global capabilities and state services** (`config`, `lang`, `light-dark`, `collection`, `toast`, `confirm`) use decoupled external stores synchronized via `useSyncExternalStore` (`core/use-external-store.ts`). They completely eliminate React Context and the former `create-provider.tsx` harness, allowing direct imperative access outside the render tree and preventing fragile provider cascades and context unmount crashes.
* **Kinetic and layout behaviors** (`useCarousel`, `useDeck`, `useCollapsible`, `useStagger`) are built as pure headless mathematical/physics hooks rather than view wrappers, returning reactive shared values and event bindings without imposing visual JSX.
* **Component-bound spatial registries** (`DndProvider`, `NavigatorProvider`) retain scoped providers only where true spatial hierarchy or page stack tree containment is structurally required.

Architectural uniformity is not a goal by itself. An implementation mechanism is chosen according to the requirements of the capability rather than forcing every capability into a single pattern.

---

## 5. Ecosystem-first

When React Native, Expo, or a mature ecosystem library already solves a problem well, Alambre should prefer using or integrating with that solution rather than maintaining a competing implementation.

Custom infrastructure should exist when it provides meaningful reusable value beyond what the ecosystem already provides.

---

## 6. UI direction

Alambre may provide reusable UI primitives, but it is not intended to become a complete component library or design system.

UI primitives should provide meaningful reusable behavior rather than merely wrapping React Native components.

The general separation is:

**Alambre**

* behavior
* interaction contracts
* reusable state handling
* accessibility behavior
* composable functionality

**Application**

* colors
* typography
* dimensions
* spacing
* visual variants
* brand identity
* concrete icons
* application-specific animations

Composition should remain simple and favor React's existing composition mechanisms.

Mere passthroughs of React Native components are not considered meaningful reusable behavior and are not part of the framework; applications import React Native primitives directly.

In line with this behavior-first principle, interactive containers (`useCarousel`, `useDeck`) are delivered as pure **headless physics hooks**: `alambre` provides kinematic mathematics (snap intervals, clamped target indices), scroll/gesture event worklets, and Reanimated shared values on the UI thread; the application owns 100% of the JSX rendering, card views, dimensions, and visual styling.

Exceptions must be explicit decisions, recorded in `docs/framework/ui-decisions.md`. One exception is already adopted: concrete icons may remain in `alambre` when they are presentation-neutral contracts — the application still owns colors, dimensions, and animation (see `docs/framework/ui-decisions.md` §2).

---

## 7. Evolution

Architectural decisions should be driven by demonstrated needs and validated patterns.

The current implementation may contain:

* experiments
* transitional abstractions
* prototypes
* legacy code
* implementation details that have not yet been validated

These should not automatically become architectural constraints.

When a proposed change affects an architectural principle or boundary, it should be discussed before implementation.

Otherwise, implementation details may be freely simplified, reorganized, replaced, or removed when doing so improves the project without changing the agreed architecture.

---

## 8. Public type contract

The public type surface of `alambre` is defined exclusively by the type exports of `src/index.ts`.

Only the types exported there are part of the public contract. Every other type is implementation detail and must not be relied upon by consumers: internal type modules live in `src/types/`, and a type exported from `src/core/`, `src/capabilities/`, or `src/behaviors/` is public only when re-exported by `src/index.ts`.

Intentional public type contracts:

* `ButtonProps`, `ButtonState` — the `Button` primitive contract.
* `StepperProps`, `StepperOptions`, `StepperState` — the `Stepper` primitive contract.
* `SliderProps`, `SliderOptions`, `SliderState` — the `Slider` primitive contract.
* `SegmentedControlProps`, `SelectOption`, `SelectOptions`, `SelectState` — the `SegmentedControl` primitive contract.
* `InputProps`, `InputState` — the `Input` primitive contract.
* `StaggerOptions`, `StaggerContextValue`, `StaggerProviderProps` — the `useStagger` headless timing contract.
* `ToastComponentProps` — the client `ToastComponent` contract of `ToastProvider`.
* `ConfirmComponentProps` — the client `ConfirmComponent` contract of `ConfirmProvider`.
* `Page`, `NavigatorObject`, `NavigatorReturn`, `NavigatorProviderProps`, `NavigationSettings`, `AnimationDefault` — the navigator behavior type contract (values exported via `NavigatorProvider`/`useNavigator`).
* `ConfigState`, `UseConfigType` — the `createConfigProvider` contract (`config`, `loading`, `saveField`).
* `Storage` — the `storage` option contract shared by `createConfigProvider`, `createLangProvider`, `createLightDarkProvider`, and `createCollectionProvider`. `remove` is optional and additive.
* `RawStorage` — the raw key-value binding adapted by `createStorage` (`removeItem` optional).
* `UseCollectionType` — the `createCollectionProvider` hook contract (`records`, `loading`, `add`, `update`, `remove`).
* `UseWheelPickerOptions`, `UseWheelPickerResult` — the `useWheelPicker` headless wheel picker contract.
* `HistoryState`, `UseHistoryStateOptions`, `UseHistoryStateReturn` — the `useHistoryState` contract and its pure history helpers.
* `UseStopwatchOptions`, `UseStopwatchReturn` — the `useStopwatch` contract.
* `CollapsibleTransitionType`, `CollapsibleSpringConfig`, `UseCollapsibleOptions`, `UseCollapsibleReturn` — the `useCollapsible` headless disclosure contract.
* `UseCarouselConfig` — the `useCarousel` headless carousel configuration contract (`cardWidth`, `cardGap`, `totalItems`, `autoPlay`, `autoPlayInterval`).
* `UseDeckConfig` — the `useDeck` headless swipeable card deck configuration contract (`initialCards`).
* `LayoutBounds`, `DroppableRegistration`, `ActiveDragState`, `DropEvent`, `DndContextValue`, `DndProviderProps`, `DraggableKineticsConfig`, `UseDraggableOptions`, `UseDraggableReturn`, `UseDroppableOptions`, `UseDroppableReturn`, `DraggableRenderProps`, `DraggableProps`, `DroppableRenderProps`, `DroppableProps`, `SortableItem`, `DropAnimationMode`, `NeighborShiftMode`, `SortableRowProps` — the headless Drag & Drop and sortable container contracts (`DndProvider`, `useDraggable`, `useDroppable`, `Draggable`, `Droppable`, `SortableRow`).
* `IconAnimationConfig` — the `iconAnimation` prop contract of the icon family and its primitives.
* `IconProps` — the shared prop contract of the concrete icons (`Arrow`, `Cross`, `Tick`, `Sun`, `Moon`).
* `HarmonicProfile`, `HarmonicMotionOptions` — the `useHarmonicMotion` headless motion contract.
* `RipplePulseOptions`, `RippleWave`, `UseRipplePulseReturn` — the `useRipplePulse` headless pulse contract.
* `WavefrontCurve`, `WavefrontPreset`, `WavefrontItemPreset`, `WavefrontStyleWorklet`, `WavefrontProviderProps`, `UseWavefrontOptions`, `UseWavefrontReturn`, `UseWavefrontItemOptions`, `UseWavefrontItemReturn` (and kinetic orchestrator aliases) — the `useWavefront`, `WavefrontProvider`, and `useWavefrontItem` single-clock traveling wave orchestration contract.
* `UsePressKineticsOptions`, `UsePressKineticsReturn` — the `usePressKinetics` universal headless tactile interaction contract.

`src/index.ts` must export its types explicitly and intentionally. Blanket namespace re-exports (`export * as ...`) that turn internal type modules into public API are not allowed.

The versioning policy for this public contract is defined in §9.

---

## 9. Versioning policy

**Status: the public contract is still being defined.** The current `1.0.x` version series is a frozen placeholder and does not promise SemVer stability. Breaking changes are currently allowed without a version bump.

### Pre-baseline phase (current)

- Breaking changes must still be intentional. Each one is recorded in §8 "Compatibility implications" and validated by the public API contract test (`packages/alambre/tests/public-api.test.ts`).
- Changes that alter an adopted architectural principle require discussion before implementation (§7 and §9).
- Git commit history collects changes continuously so nothing is lost for the future baseline declaration (eliminating the need for an out-of-sync manual CHANGELOG.md during rapid pre-baseline evolution).

### Baseline declaration (future)

A baseline will be declared when the public contract is considered solid enough to develop an application without issues, validated through the reference application (`apps/colguetti`). No change to the public contract happens implicitly.

From the baseline onward:

- SemVer applies: breaking public contract changes require a major version bump; additive changes a minor; fixes a patch. Breaking includes any removal, rename, or signature change of a public export of `src/index.ts`.
- Agents may bump patch and minor versions autonomously. Any breaking change (and therefore any major bump) requires explicit approval before it is shipped.

### Compatibility implications

The former `DefaultReact`, `ActionTypes`, `HooksTypes`, and `IconstTypes` namespaces are no longer part of the public API. They were blanket re-exports of internal type modules; their members that constitute genuine public contracts now have first-class names (`Storage`, `IconAnimationConfig`, `IconProps`).

`BaseModule` and `createModuleProvider` are no longer part of the public API (Q1 restructure). The shared module machinery was replaced by an internal `core` (`createStore` + `createProvider`); the public surface is the concrete capability factories (`createConfigProvider`, `createLangProvider`, `createLightDarkProvider`) and behaviors (`createApiProvider`, `NavigatorProvider`/`useNavigator`, `ToastProvider`/`useToast`). This is breaking for any consumer relying on the module machinery directly.

`core/create-provider.tsx` was completely removed in favor of external stores powered by `useSyncExternalStore` (`core/use-external-store.ts`). Capability factories (`createConfig`, `createLang`, `createLightDark`, `createCollection`) return `{ store, actions, use... }`. React Context is no longer used for these capabilities, and enclosing Provider components are no longer required. The `*Provider` factory names (`createConfigProvider`, etc.) remain as alias exports to prevent breaking existing imports.

`ToastProvider` and `ConfirmProvider` are retained as aliases to `ToastHost` and `ConfirmHost` (pure component hosts for rendering modals/banners), while their state is managed via external stores (`createToastStore`, `createConfirmStore`). Imperative methods (`toast.show()`, `toast.dismiss()`, `confirm()`, `dismissConfirm()`) are directly accessible outside the React component tree.

`createApi` (alias `createApiProvider`) no longer exposes `useApi`. Requests are built using `createQueryHook` and `createMutationHook`, and `ApiProvider` serves strictly to inject TanStack's `QueryClientProvider` without maintaining an internal Alambre context.

`useCarousel` and `useDeck` are additive headless physics hooks for kinetic containers (see `docs/reference/behaviors.md` §5 and §6). Validated in `tests/public-api.test.ts`.

`AnimadoView` and its `AnimadoTypes` type surface were moved out of the framework to the application layer after the animado review (see `docs/framework/ui-decisions.md` §2): animating colors is application presentation, the component had a single demo consumer and no second demonstrated need. This is breaking for any consumer using them; the demo was the only known consumer and no implementation remains in the repository.

`createCollectionProvider` is an additive capability (Q3/I6): a typed, persisted, content-driven collection over the `Storage` adapter (see `docs/reference/capabilities.md` §4). The `Storage` contract gained an optional `remove` (additive). Both are covered by `tests/capabilities/collection-provider.test.tsx` and validated by `tests/public-api.test.ts`.

`TimePicker` was retired and removed from the public API (eliminating the provisional presentation exception) in favor of the headless `useWheelPicker` physics hook (see `docs/reference/behaviors.md` §7). Presentation, row styling, selection bands, and formatting are 100% application-owned. Validated in `tests/public-api.test.ts`.

`useCollapsible` is an additive headless hook for expandable/collapsible disclosure animations (see `docs/reference/hooks.md` §5). Validated by `tests/hooks/use-collapsible.test.tsx`.

`DndProvider`, `useDraggable`, `useDroppable`, `Draggable`, `Droppable`, and `SortableRow` are additive headless drag-and-drop primitives for spatial hit-testing and sortable lists (see `docs/reference/dnd.md`). Validated by `tests/public-api.test.ts`.

Two Q3 prototypes were intentionally **not** extracted: navigator params (the app's `RouteIntent` context) and the shared `createId` util. Both delight the app but stayed application-level until a second consumer demonstrates reuse (see `docs/guidelines/agents.md` §6).

`useHarmonicMotion` and `useRipplePulse` are additive headless motion hooks for UI-thread continuous kinetics (see `docs/reference/hooks.md`). Evaluated pure helper worklets (`harmonicValue`, `rippleSample`) are also exported to compose with custom timing loops.

`useWavefront` (alias `useKineticOrchestrator`), `WavefrontProvider`, and `useWavefrontItem` (alias `useKineticOrchestratorItem`) provide single-clock UI-thread wavefront orchestration fulfilling the 3-Line Rule without $N$-ODE spring concurrency overload (see `docs/reference/hooks.md`). Closed-form analytical curve worklets (`criticallyDampedCurve`, `bouncyCurve`, `cubicEaseOutCurve`, `polynomialOvershootCurve`), `calculateWavefrontPhase`, Apple-style duration springs, and `calculateBudgetedStaggerDelay` provide $O(1)$ CPU-budgeted staggered kinetics.

`usePressKinetics` is an additive universal headless tactile interaction hook providing 60/120 FPS UI-thread micro-touch feedback (spring scale, depress translation, clamped opacity) with asymmetric physics (responsive press-in, bouncy release) and zero JS thread re-render overhead. Validated in `tests/hooks/use-press-kinetics.test.ts` and `tests/public-api.test.ts`.

`useSpatialFlip` and `useFlightTrajectory` are additive headless spatial kinetics hooks for 3D card flips, projectile flights, and token dealing (see `docs/reference/hooks.md` §8 and §9). Face-injected perspective solves cross-platform 2D projection quirks on Android, clamped parabolic math guarantees upward elevation without table depression on spring overshoot, and unmount cancellation prevents memory leaks. `calculateHandFan` and `parabolicAltitudeCurve` provide domain-neutral UI-thread worklet math for auto-compressed curved decks and ballistic elevation (see `docs/reference/hooks.md` §10). Validated in `tests/core/spatial.test.ts`, `tests/hooks/use-spatial-flip.test.ts`, `tests/hooks/use-flight-trajectory.test.ts`, and `tests/public-api.test.ts`.

Any consumer importing those types is affected by these changes. The known consumers in this repository only use retained types and are unaffected.

The versioning policy for this public contract is defined in §9.

