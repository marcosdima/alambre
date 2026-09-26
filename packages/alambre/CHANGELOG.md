# Changelog

All notable changes to `alambre` are documented in this file.

The package is currently in a **pre-baseline phase**: the public contract is still being defined and the current `1.0.x` version series is a frozen placeholder (see `docs/architecture.md` §9). SemVer constraints do not apply until a baseline is declared.

## Unreleased — pre-baseline history

Breaking and structural changes recorded while the contract was being defined, kept until the baseline is declared:

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