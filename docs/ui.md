# UI Decisions

This document records decisions that are specific to the UI direction of `alambre` without changing the global architecture boundaries.

Global principles live in `docs/architecture.md` (section 6 covers the general UI direction). This file captures how those principles are materialized in concrete components.

---

## 1. Button — first behavior-first UI primitive

### Adopted

* `Button` is the first UI primitive designed under the behavior-first direction: **alambre defines behavior and contracts; the application defines presentation and visual identity.**
* `Button` replaces `BorderButton`. Both must not coexist as public framework components. `BorderButton` is the previous component, superseded by the new UI direction and removed from the public API.
* `Button` is exported top-level from `alambre` (`import { Button } from 'alambre'`).

### Responsibilities of `Button`

* `loading` state.
* `disabled` state.
* `pressed` state.
* Prevention of interaction during blocking states (`loading` and `disabled` block `onPress`).
* Accessibility: default `role="button"`, `accessibilityState.busy` and `accessibilityState.disabled` derived from state, merging any consumer-provided accessibility state.
* Composition through `children`.
* Exposing the interaction state (`{ pressed, disabled, loading }`) to the consumer via the `children` render prop and the `style` callback.

### Non-responsibilities of `Button`

* No visual variants (`primary`, `secondary`, `danger`, etc.).
* No sizes, icons, color schemes, typography, spacing, or brand identity.
* No application-specific animations.
* No formal state machine, design tokens, slots, or generalized animation system.

### Intended usage pattern

An application composes its own presentation component on top of `alambre.Button` (for example `AppButton`) to define variants, sizes, and identity. The demo app validates this pattern with `apps/demo/src/components/AppButton.tsx`.

---

## 2. Application owns presentation

Following `docs/architecture.md` section 6, the framework no longer ships opinionated or hard-coded presentation. The application is the owner of colors, typography, dimensions, concrete icons and application-specific animations.

### Resolved fates

* `Title` and `SubTitle` were removed from the framework (hard-coded typography). The application owns typography: the demo implements `AppTitle` (`apps/demo/src/components/AppTitle.tsx`). `SubTitle` had no consumers and was dead code.
* `SafeAreaView` was removed from the framework. Safe areas are an ecosystem concern solved by `react-native-safe-area-context` (ecosystem-first); the demo uses it directly. The dependency was dropped from `alambre`'s peer and dev dependencies.
* `DefaultToastBody` was removed. `ToastProvider` already requires a client-provided `ToastComponent`; a canned, branded toast body shipped in the framework was application presentation. The demo owns its toast body (`apps/demo/src/providers/toast.tsx`).
* `NavigatorBody` was moved to the application: the demo owns its navigation chrome (`apps/demo/src/navigator/AppNavigatorBody.tsx`). The framework keeps the reusable navigation behavior (`NavigatorProvider` + `useNavigator`).
* `ToggleLightDark` was moved to the application: the demo owns its light/dark switch (`apps/demo/src/components/ToggleLightDark.tsx`).
* `AnimadoText` was removed (dead export with no consumers). `AnimadoView` remains for now; its animation scope is reviewed separately.

### Icons: kept in the framework, decoupled from hard-coded presentation

The concrete icons (`Sun`, `Moon`, `Arrow`, `Cross`, `Tick`) **remain in alambre**, but no longer impose a concrete application's presentation:

* `color` is required (no hard-coded `black`/`orange`/`gray` strokes and fills); optional `fill` is accepted where the shape supports it.
* Animation timing and behavior are driven by the `iconAnimation` configuration (the same `drawAnimation`/`resetAnimation` contract used by the base primitives), not by fixed durations inside the icon.
* Removed non-reproducible randomness (e.g. `Moon`'s random stroke offsets) and fixed viewport defaults that were presentation choices.
* Geometry (the shape itself) stays: a tick is a tick. Shapes are a concept, not application identity.

The graphic primitives (`base/Circle` and `base/Line`, plus the animated utilities used by them) remain as generic drawing infrastructure.

> `base/Path` was removed from the framework: it was an orphaned public primitive with no internal or external consumer, never validated, and its implementation did not follow the shared drawing contract used by `Circle` and `Line` (it hard-coded its own timing and relied on native path measurement). Removing it is consistent with the abstraction criteria (no artificial consumer, no unvalidated public surface).

> Forward note: a future layer of common defaults and styling may live in a "Base Native"/"Base Template" layer once that layer is definitively defined. This decision does not introduce it.

---

## 3. Base contracts retained

`Text` and `View` remain as thin passthrough contracts (no presentation). They are not opinionated components; whether mere pass-throughs add enough reusable value is a future review, not resolved here.

---

## 4. Open questions

* Whether the behavior-first pattern validated with `Button` extends to other UI primitives.