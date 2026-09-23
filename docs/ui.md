---
title: UI Decisions
summary: Concrete UI direction and component decisions for alambre, materializing architecture.md §6.
---

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
* `AnimadoView` was moved out of the framework to the application layer: it had a single demo consumer and no second demonstrated need, and animating colors is application presentation. Its review is closed; the demo no longer exists in the reference app, so no implementation remains in the repository. It is not part of the framework's public API.

### Icons: kept in the framework, decoupled from hard-coded presentation

The concrete icons (`Sun`, `Moon`, `Arrow`, `Cross`, `Tick`) **remain in alambre**, but no longer impose a concrete application's presentation:

* `color` is required (no hard-coded `black`/`orange`/`gray` strokes and fills); optional `fill` is accepted where the shape supports it. The base `Circle` defaults to `fill: 'none'` so strokes always stay outlines, and `Sun` defaults its fill to amber `#fbbf24` — both are overridable via `fill`, never baked into the framework as identity.
* Animation timing and behavior are driven by the `iconAnimation` configuration (the same `drawAnimation`/`resetAnimation` contract used by the base primitives), not by fixed durations inside the icon.
* Removed non-reproducible randomness (e.g. `Moon`'s random stroke offsets) and fixed viewport defaults that were presentation choices.
* Geometry (the shape itself) stays: a tick is a tick. Shapes are a concept, not application identity.

* `Arrow` honours the full `iconAnimation`/`strokeOffset` contract like the other concrete icons (a regression where it swallowed those props was surfaced and fixed during test coverage).

* The icon layer (base primitives and concrete icons) is covered by contract tests in `packages/alambre/tests/components/icons-base.test.tsx` and `packages/alambre/tests/components/icons.test.tsx` (draw/reset, `strokeOffset`, `rotation`, `iconAnimation`, geometry and fill).

The graphic primitives (`base/Circle`, `base/Line` and `base/Path`, plus the animated utilities used by them) remain as generic drawing infrastructure. `base/Path` was re-introduced to draw curved shapes (catalog icons) with the same drawing contract as the other primitives: `pathLength` is normalized to `1` with `strokeDasharray: 1` so the draw animation follows the shared `useIconAnimation` contract instead of native path measurement; `strokeDasharray` scales with `rotation` around the origin exactly like `Circle`/`Line`.

> Forward note: a future layer of common defaults and styling may live in a "Base Native"/"Base Template" layer once that layer is definitively defined. This decision does not introduce it.

### `TimePicker`: provisional presentation exception

`TimePicker` ships as a framework input with a **themeable `accentColor`** (the application controls the accent exactly like other themable surfaces) but its remaining presentation — arrow glyphs, row typography and sizes, wheel dimensions and spacing, the inactive-label color, and the default accent hex — is **hardcoded in the framework**. This is a provisional exception while the input's design discipline is settled; the default accent currently mirrors the reference app's primary color, which is application presentation leaking in and should be revisited when the input becomes presentation-agnostic (e.g. presentation moved to the consumer via style/theme props or a composed wrapper).

`visibleCount` currently defaults to `3` (previous / current / next value visible) with increment/decrement arrows and wrap-around at range edges. A scroll wheel with momentum and snap is deferred; the fixed-tap viewport avoids nested-scroll and layout-jump issues with a reasonable UX while the scroll contract is understood.

---

## 3. Base contracts: passthroughs were not retained

`Text` and `View` were removed from the public API. They were pure passthroughs of React Native components with no reusable contract or behavior, which contradicts `docs/architecture.md` section 6 ("UI primitives should provide meaningful reusable behavior rather than merely wrapping React Native components"). Applications import `Text` and `View` from `react-native` directly.

`DefaultReact.TextProps` and `ViewProps` are kept as internal type contracts used by the core provider wiring, the icons, and the navigator. `TextProps` was removed once its only consumer (`animado`) left the framework.

---

## 4. Behavior-first Inputs: `Stepper` and `Input`

Following the direction established by `Button` (§1):

### `Stepper` and `useStepper`

* `Stepper` provides numeric stepping logic, boundary clamping (`min`/`max`), step precision handling, disabled states, and accessibility (`role="spinbutton"`, `accessibilityValue={{ min, max, now }}`).
* It exposes the interactive state (`{ value, canIncrement, canDecrement, increment, decrement, setValue, disabled }`) through a `children` render prop and `style` callback.
* No visual styling, +/- symbols, or layout is hard-coded in `alambre`. Applications compose their own presentation (for example `AppStepper` in `base-template`).

### `Input`

* `Input` provides behavior-first text input wrapping React Native's `TextInput`.
* Manages `focused`, `disabled`, and `error` states, exposing them to the consumer via `style={({ focused, disabled, error }) => ...}`.
* Enforces accessible semantics (`aria-invalid`, `accessibilityState.disabled`).

### `Slider` and `useSlider`

* `Slider` provides continuous or stepped numeric input calculation, boundary clamping (`min`/`max`), step snapping, and ratio calculation.
* Handles touch responder gestures (`onResponderGrant`, `onResponderMove`, `onResponderRelease`) tracking container dimensions via `onLayout` without imposing hardcoded thumb or track visuals.
* Enforces accessibility with `role="adjustable"`, `accessibilityValue={{ min, max, now }}`, and accessibility actions (`increment`, `decrement`).
* Exposes `SliderState` (`{ value, ratio, percentage, increment, decrement, setValue, setValueFromRatio, disabled }`) via children render prop and style callback.
* Application presentation: `apps/base-template/src/components/AppSlider.tsx`.

### `SegmentedControl` and `useSelect`

* `SegmentedControl` provides discrete single-option selection over a collection of items.
* Manages selected value, active index, and disabled states.
* Enforces accessibility with `role="radiogroup"`, child option `role="radio"`, and `accessibilityState={{ selected }}`.
* Presentation-agnostic: the consumer receives `SelectState<T>` (`{ value, selectedIndex, select, isSelected, options, disabled }`).
* Application presentation: `apps/base-template/src/components/AppSegmentedControl.tsx` (segmented tab pills) and `apps/base-template/src/components/AppSelect.tsx` (expandable dropdown).

---

## 5. Headless animation timing: `useStagger`

Following the principle that the framework defines behavior while the application defines visual presentation (`docs/architecture.md` §6):

* `useStagger` and `calculateStaggerDelay` provide headless stagger timing coordination across sequential elements.
* **Non-responsibilities:** The framework does NOT choose visual entrance animations (`FadeInDown`, `FadeInUp`, `ZoomIn`, springs, keyframes, or easing curves) and does NOT impose animation wrappers. Applications pair the computed delays (`getDelay(index)`) with whatever presentation or Reanimated builder they choose.
* **Accessibility:** Automatically integrates with `useReducedMotion()`. When reduced motion is preferred by the user, `calculateStaggerDelay` returns `0` immediately to avoid unnatural delayed stalls without breaking layout.
* **Optional composition:** `StaggerProvider` and `useStaggerItem` allow deep component trees to consume stagger timing without manual prop drilling, falling back gracefully to local calculations when no provider is present.