# Changelog

All notable changes to `alambre` are documented in this file.

The package is currently in a **pre-baseline phase**: the public contract is still being defined and the current `1.0.x` version series is a frozen placeholder (see `docs/architecture.md` §9). SemVer constraints do not apply until a baseline is declared.

## Unreleased

- [add] **Text Animations Primitives**: Introduced kinetic typography and animated text components:
  - `<CountUp>`: Tabular-nums digit-column rolling counter with cubic deceleration and off-screen height probe.
  - `<Typewriter>`: Linear character-by-character progressive text reveal on the UI thread using uneditable `AnimatedTextInput` with `useAnimatedProps`.
  - `<Scramble>`: Randomized glyph matrix decrypting reveal with quadratic ease-out.
  - `<Marquee>`: Infinite looping horizontal content ticker with auto-measured clone wrap and zero jitter.
  - `<WavyText>`: Continuous staggered vertical sinusoidal oscillation across characters.
  - `<SlideInText>`: Physics-driven staggered card/glyph cascade powered by `kinetics.spring.bouncy`.
- [add] **Hold-to-Repeat Gestures (`useContinuousPress`)**: Headless continuous press gesture coordination with immediate tap actuation, configurable hold threshold (`delay`), interval repetition, and dynamic interval acceleration (`intervalMultiplier`).
- [docs] **Functional Reference**: Created `docs/reference/text-animations.md`, added `useContinuousPress` section to `docs/reference/behaviors.md`, and updated `docs/reference/index.md`.

## 1.2.0 — 2026-10-01

Major structural refactor migrating global capabilities and interaction behaviors from React Context to pure reactive external stores and headless physics hooks (Agent-First DX):

- [refactor] **Zero Context for Global Capabilities**: Migrated `createConfig`, `createLang`, `createLightDark`, and `createCollection` to external stores powered by `useSyncExternalStore` (`core/use-external-store.ts`). Capability factories return `{ store, actions, use... }`. Enclosing Provider components (`<ConfigProvider>`, etc.) are no longer required, and `core/create-provider.tsx` was permanently removed.
- [refactor] **Reactive & Imperative Behaviors**:
  - `toast`: Converted to external store with direct imperative `toast.show()`, `toast.dismiss()`, `toast.clear()`, and `toast.next()`. Introduced `ToastHost` (alias `ToastProvider` for backward compatibility) as a pure UI rendering slot.
  - `confirm`: Converted to external store with Promise-based imperative `confirm()` and `dismissConfirm()`. Introduced `ConfirmHost` (alias `ConfirmProvider`) as UI rendering slot.
  - `createApi`: Removed `useApi` in favor of direct hook generation (`createQueryHook`, `createMutationHook`) and TanStack `QueryClientProvider` wrapper (`ApiProvider`).
- [add] **Headless Physics Hooks**:
  - `useCarousel`: Pure kinetic hook with Reanimated scroll worklets (`scrollRef`, `scrollX`, `onMomentumScrollEnd`, `activeIndex`, `scrollToIndex`) and pure math helpers (`calculateSnapInterval`, `calculateActiveIndex`, `getScrollTargetForIndex`). Decouples scrolling and snapping physics from visual cards.
  - `useDeck`: Headless swipeable card stack managing angular kinematics, translation shared values, undo/history stack, and programmatic actions (`popCard`, `undoLast`, `triggerProgrammaticSwipe`, `reset`).
  - `useWheelPicker`: Headless kinetic wheel picker with momentum flick physics, spring settling, virtual multi-cycle infinite scrolling, and step tap interactions.
- [refactor] **Retire `TimePicker` component**: Removed `TimePicker` and `TimePickerProps` from the public framework API, eliminating the provisional presentation exception from `docs/ui.md` §2. Applications compose visual wheel presentation (e.g. `SwipeableTimePicker.tsx` in `apps/colguetti`) on top of `useWheelPicker`.
- [fix] Fixed `create-api.tsx` extension for native JSX support in TanStack `QueryClientProvider`.
- [refactor] **First-Class Type Safety & State Modernization (Proposal 4)**:
  - Modernized `createConfig` to support broad generics `T extends Record<string, unknown>` (supporting booleans, numbers, and nested objects with safe JSON serialization/deserialization), strictly typed `saveField<K extends keyof T>(field: K, value: T[K])`, and added `loading` state during async hydration.
  - Parameterized `useNavigator<TRoute, TSubpage>` for strict compile-time route validation on `navigate(target, settings)`.
  - Dismantled blanket `export * as NavigatorTypes` namespace from `types/index.ts`; promoted `Page`, `NavigatorObject`, `NavigatorReturn`, `NavigatorProviderProps`, `NavigationSettings`, and `AnimationDefault` directly into top-level public API in `src/index.ts`, and updated consumer apps.
- [test] Added unit and behavioral test suites for `carousel.test.tsx` and `deck.test.tsx`; updated `public-api.test.ts` to validate value and type contracts.
- [docs] Full documentation corpus audit: updated `docs/architecture.md` (§4, §6, §8, §9), cleaned low-level component details and presentation exceptions from `docs/ui.md` (§2, §7), added `useWheelPicker` to `docs/reference/behaviors.md` and `docs/reference/index.md`, and kept high-level documents strictly focused on boundaries and architecture.

## 1.1.0 — 2026-09-26

Key features, structural refactors, and public type contracts graduated in this release:

- [refactor] Restructure `modules` into an internal `core` (`createStore`, `createProvider`), content-driven `capabilities` (config, lang, light-dark) and `behaviors` (api, navigator, toast).
- [refactor] Remove `BaseModule` and `createModuleProvider` from the public API.
- [refactor] Curate the public type surface into first-class contracts (`Storage`, `IconAnimationConfig`, `IconProps`) and remove the internal blanket namespace re-exports.
- [refactor] Move `AnimadoView` (and its `AnimadoTypes`) to the application layer.
- [test] Reorganize the test suite to mirror the `src` tree (`core`/`capabilities`/`behaviors`/`components`).
- [add] Add `createCollectionProvider` capability: a content-driven, persisted, typed collection (add/update/remove) built on `createStore`/`createProvider` and the `Storage` adapter (validated in the base-template reference app: items and alarms are now consumers).
- [add] Extend the `Storage` contract with an optional `remove` (additive; existing adapters remain valid).
- [add] Add `TimePicker` input component: a 24h hour/minute wheel with `value`/`onChange` as an `HH:MM` string and a themeable accent. Pure time math lives in `components/time/time-utils` (validated in colguetti's alarm form).
- [fix] `TimePicker`: rebuild as a fixed tap viewport with increment/decrement arrows (rows rendered around the selection, taps accept, arrows clamp), replacing the earlier `ScrollView`-snapping wheel to avoid nested scroll and layout jump issues. Compact defaults: 34px rows, visible rows later reduced from 5 to 3 for a more compact viewport.
- [refactor] Remove dead internal helpers from `components/time/time-utils` (`clampIndex`, `indexFromOffset`) left over from the discarded `ScrollView` design, and remove internal unused type `LineCoords` (`components/icons/utils.ts`) and `PressableProps` (`types/default-react.ts`). Internal-only cleanup: no public type or export was changed.
- [add] Add `useCollapsible` headless hook: off-screen layout measurement probe, spring/timing interpolation, and automatic reduced motion support for accordions and collapsible sections.
- [add] Add Drag & Drop subsystem: `DndProvider`, `useDnd`, `useDraggable`, `useDroppable`, `Draggable`, `Droppable`, and `SortableRow`. Headless primitives with 60fps pan gesture worklets, velocity tilt, boundary clamping, neighbor shift modes (`glide`, `linear`, `damped`, `bounce`), drop settle modes (`seamless`, `bounce`, `impact`), and TalkBack/VoiceOver accessibility actions.
- [docs] Comprehensive functional reference audit: created `docs/reference/dnd.md`, documented `useCollapsible` in `docs/reference/hooks.md`, fixed section numbering in `docs/reference/components.md`, and updated `docs/reference/index.md` and `docs/architecture.md`.