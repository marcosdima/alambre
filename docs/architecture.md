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

Different problems may justify different approaches.

Architectural uniformity is not a goal by itself.

An implementation mechanism should be chosen according to the requirements of the capability rather than forcing every capability into a common pattern.

Current implementation patterns are therefore not automatically architectural decisions.

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

Exceptions must be explicit decisions, recorded in `docs/ui.md`. One exception is already adopted: concrete icons may remain in `alambre` when they are presentation-neutral contracts — the application still owns colors, dimensions, and animation (see `docs/ui.md` §2).

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
* `ToastComponentProps` — the client `ToastComponent` contract of `ToastProvider`.
* `ConfirmComponentProps` — the client `ConfirmComponent` contract of `ConfirmProvider`.
* `NavigatorTypes` — the navigator behavior type contract (values exported via `NavigatorProvider`/`useNavigator`).
* `Storage` — the `storage` option contract shared by `createConfigProvider`, `createLangProvider`, `createLightDarkProvider`, and `createCollectionProvider`. `remove` is optional and additive.
* `RawStorage` — the raw key-value binding adapted by `createStorage` (`removeItem` optional).
* `UseCollectionType` — the `createCollectionProvider` hook contract (`records`, `loading`, `add`, `update`, `remove`).
* `TimePickerProps` — the `TimePicker` input contract.
* `HistoryState`, `UseHistoryStateOptions`, `UseHistoryStateReturn` — the `useHistoryState` contract and its pure history helpers.
* `UseStopwatchOptions`, `UseStopwatchReturn` — the `useStopwatch` contract.
* `IconAnimationConfig` — the `iconAnimation` prop contract of the icon family and its primitives.
* `IconProps` — the shared prop contract of the concrete icons (`Arrow`, `Cross`, `Tick`, `Sun`, `Moon`).

`src/index.ts` must export its types explicitly and intentionally. Blanket namespace re-exports (`export * as ...`) that turn internal type modules into public API are not allowed.

The versioning policy for this public contract is defined in §9.

---

## 9. Versioning policy

**Status: the public contract is still being defined.** The current `1.0.x` version series is a frozen placeholder and does not promise SemVer stability. Breaking changes are currently allowed without a version bump.

### Pre-baseline phase (current)

- Breaking changes must still be intentional. Each one is recorded in §8 "Compatibility implications" and validated by the public API contract test (`packages/alambre/tests/public-api.test.ts`).
- Changes that alter an adopted architectural principle require discussion before implementation (§7 and `docs/project.md` §4.2).
- `packages/alambre/CHANGELOG.md` collects changes manually so nothing is lost for the future baseline.

### Baseline declaration (future)

A baseline will be declared when the public contract is considered solid enough to develop an application without issues, validated through the reference application (`apps/colguetti`). No change to the public contract happens implicitly.

From the baseline onward:

- SemVer applies: breaking public contract changes require a major version bump; additive changes a minor; fixes a patch. Breaking includes any removal, rename, or signature change of a public export of `src/index.ts`.
- Agents may bump patch and minor versions autonomously. Any breaking change (and therefore any major bump) requires explicit approval before it is shipped.

### Compatibility implications

The former `DefaultReact`, `ActionTypes`, `HooksTypes`, and `IconstTypes` namespaces are no longer part of the public API. They were blanket re-exports of internal type modules; their members that constitute genuine public contracts now have first-class names (`Storage`, `IconAnimationConfig`, `IconProps`).

`BaseModule` and `createModuleProvider` are no longer part of the public API (Q1 restructure). The shared module machinery was replaced by an internal `core` (`createStore` + `createProvider`); the public surface is the concrete capability factories (`createConfigProvider`, `createLangProvider`, `createLightDarkProvider`) and behaviors (`createApiProvider`, `NavigatorProvider`/`useNavigator`, `ToastProvider`/`useToast`). This is breaking for any consumer relying on the module machinery directly.

`AnimadoView` and its `AnimadoTypes` type surface were moved out of the framework to the application layer after the animado review (see `docs/ui.md` §2): animating colors is application presentation, the component had a single demo consumer and no second demonstrated need. This is breaking for any consumer using them; the demo was the only known consumer and no implementation remains in the repository.

`createCollectionProvider` is an additive capability (Q3/I6): a typed, persisted, content-driven collection over the `Storage` adapter, demonstrated in the reference app (Colguetti items and alarms). The `Storage` contract gained an optional `remove` (additive). Both are covered by `tests/capabilities/collection-provider.test.tsx` and validated by `tests/public-api.test.ts`.

`TimePicker` is an additive input component: a 24h hour/minute wheel built as a fixed tap viewport with increment/decrement arrows (no native dependencies and no scrolling), exposed with `value`/`onChange` as an `HH:MM` string and a themeable accent. The wheel renders the selected row and its neighbours and accepts taps; the arrows clamp to the range. Its pure time math (`components/time/time-utils`) is unit-tested, and the component is covered by `tests/components/time-picker.test.tsx`. It is validated in the reference app's alarm form (Colguetti). The display wraps the row labels around the range edges; the previous ScrollView-snapping implementation was replaced (fixed tap viewport) to avoid nested scroll and layout jump issues.

Two Q3 prototypes were intentionally **not** extracted: navigator params (the app's `RouteIntent` context) and the shared `createId` util. Both delight the app but stayed application-level until a second consumer demonstrates reuse (see `docs/discoveries.md`).

Any consumer importing those types is affected by these changes. The known consumers in this repository only use retained types and are unaffected.

The versioning policy for this public contract is defined in §9.
