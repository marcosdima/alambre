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

An application composes its own presentation component on top of `alambre.Button` (for example `AppButton`) to define variants, sizes, and identity. The reference application (apps/colguetti) validates this pattern with `apps/colguetti/src/components/AppButton.tsx`.

---

## 2. Application owns presentation

Following `docs/architecture.md` section 6, the framework no longer ships opinionated or hard-coded presentation. The application is the owner of colors, typography, dimensions, concrete icons and application-specific animations.

### Resolved fates

* `Title` and `SubTitle` were removed from the framework (hard-coded typography). The application owns typography: the reference app implements `AppTitle` (`apps/colguetti/src/components/AppTitle.tsx`). `SubTitle` had no consumers and was dead code.
* `SafeAreaView` was removed from the framework. Safe areas are an ecosystem concern solved by `react-native-safe-area-context` (ecosystem-first); the reference app uses it directly. The dependency was dropped from `alambre`'s peer and dev dependencies.
* `DefaultToastBody` was removed. `ToastProvider` already requires a client-provided `ToastComponent`; a canned, branded toast body shipped in the framework was application presentation. The reference app owns its toast body (`apps/colguetti/src/providers/toast.tsx`).
* `NavigatorBody` was moved to the application: the reference app owns its navigation chrome (`apps/colguetti/src/navigator/AppNavigatorBody.tsx`). The framework keeps the reusable navigation behavior (`NavigatorProvider` + `useNavigator`).
* `ToggleLightDark` was moved to the application: the reference app owns its light/dark switch (`apps/colguetti/src/components/ToggleLightDark.tsx`).
* `AnimadoText` was removed (dead export with no consumers).
* `AnimadoView` was moved to the application: it had a single demo consumer and no second demonstrated need, and animating colors is application presentation (`apps/colguetti/src/components/AnimadoView.tsx`). Its review is closed; it is not part of the framework's public API.

### Icons: kept in the framework, decoupled from hard-coded presentation

The concrete icons (`Sun`, `Moon`, `Arrow`, `Cross`, `Tick`) **remain in alambre**, but no longer impose a concrete application's presentation:

* `color` is required (no hard-coded `black`/`orange`/`gray` strokes and fills); optional `fill` is accepted where the shape supports it.
* Animation timing and behavior are driven by the `iconAnimation` configuration (the same `drawAnimation`/`resetAnimation` contract used by the base primitives), not by fixed durations inside the icon.
* Removed non-reproducible randomness (e.g. `Moon`'s random stroke offsets) and fixed viewport defaults that were presentation choices.
* Geometry (the shape itself) stays: a tick is a tick. Shapes are a concept, not application identity.

* `Arrow` honours the full `iconAnimation`/`strokeOffset` contract like the other concrete icons (a regression where it swallowed those props was surfaced and fixed during test coverage).

* The icon layer (base primitives and concrete icons) is covered by contract tests in `packages/alambre/tests/components/icons-base.test.tsx` and `packages/alambre/tests/components/icons.test.tsx` (draw/reset, `strokeOffset`, `rotation`, `iconAnimation`, geometry and fill).

The graphic primitives (`base/Circle` and `base/Line`, plus the animated utilities used by them) remain as generic drawing infrastructure.

> `base/Path` was removed from the framework: it was an orphaned public primitive with no internal or external consumer, never validated, and its implementation did not follow the shared drawing contract used by `Circle` and `Line` (it hard-coded its own timing and relied on native path measurement). Removing it is consistent with the abstraction criteria (no artificial consumer, no unvalidated public surface).

> Forward note: a future layer of common defaults and styling may live in a "Base Native"/"Base Template" layer once that layer is definitively defined. This decision does not introduce it.

---

## 3. Base contracts: passthroughs were not retained

`Text` and `View` were removed from the public API. They were pure passthroughs of React Native components with no reusable contract or behavior, which contradicts `docs/architecture.md` section 6 ("UI primitives should provide meaningful reusable behavior rather than merely wrapping React Native components"). Applications import `Text` and `View` from `react-native` directly.

`DefaultReact.TextProps` and `ViewProps` are kept as internal type contracts used by the core provider wiring, the icons, and the navigator. `TextProps` was removed once its only consumer (`animado`) left the framework.