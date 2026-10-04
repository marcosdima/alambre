---
title: UI Decisions
summary: Concrete UI direction and component decisions for alambre, materializing architecture.md §6.
---

# UI Decisions

This document records decisions that are specific to the UI direction of `alambre` without changing the global architecture boundaries.

Global principles live in `docs/framework/architecture.md` (section 6 covers the general UI direction). This file captures how those principles are materialized in concrete components.

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

Following `docs/framework/architecture.md` section 6, the framework no longer ships opinionated or hard-coded presentation. The application is the owner of colors, typography, dimensions, concrete icons and application-specific animations.

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

---

## 3. Base contracts: passthroughs were not retained

`Text` and `View` were removed from the public API. They were pure passthroughs of React Native components with no reusable contract or behavior, which contradicts `docs/framework/architecture.md` section 6 ("UI primitives should provide meaningful reusable behavior rather than merely wrapping React Native components"). Applications import `Text` and `View` from `react-native` directly.

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

Following the principle that the framework defines behavior while the application defines visual presentation (`docs/framework/architecture.md` §6):

* `useStagger` and `calculateStaggerDelay` provide headless stagger timing coordination across sequential elements.
* **Non-responsibilities:** The framework does NOT choose visual entrance animations (`FadeInDown`, `FadeInUp`, `ZoomIn`, springs, keyframes, or easing curves) and does NOT impose animation wrappers. Applications pair the computed delays (`getDelay(index)`) with whatever presentation or Reanimated builder they choose.
* **Accessibility:** Automatically integrates with `useReducedMotion()`. When reduced motion is preferred by the user, `calculateStaggerDelay` returns `0` immediately to avoid unnatural delayed stalls without breaking layout.
* **Optional composition:** `StaggerProvider` and `useStaggerItem` allow deep component trees to consume stagger timing without manual prop drilling, falling back gracefully to local calculations when no provider is present.

---

## 6. Gesture Contention & Hierarchy in Compound Rows

When designing compound list rows that support swipe-to-action behaviors (such as `SwipeableItemRow` / swipe-to-delete), touch responder hierarchy rules must be strictly respected:

### Prohibited: Nested horizontal drag responders

Embedding child components that register continuous horizontal pan gestures (such as gesture-driven carousels or horizontal sliders) inside a list row that itself listens to horizontal swipes creates unresolvable responder contention in `react-native-gesture-handler`. The inner pan gesture steals the drag events or locks up the parent row, preventing users from revealing actions or deleting items.

### Adopted solutions for compound rows

1. **Static preview summaries with overflow badges:** Display up to a fixed number $K$ of static preview chips (e.g. icon + label) followed by a `+N` badge indicating remaining elements. This pattern eliminates gesture conflict entirely and keeps row scrolling smooth (validated in `apps/colguetti` `Alarms.tsx`).
2. **Discrete tap controls:** If interactive cycling or stepped input is required inside a swipeable row, use discrete tap controls (such as steppers or chevrons) with bounded touch hit bounds (`hitSlop`), never continuous pan drag responders.
3. **Dedicated screen / modal for interactive collections:** When complex gesture-driven reordering or sliding is necessary, the interaction belongs on a dedicated subpage or modal dialog where the full screen gesture namespace is available without competing list responders.

---

## 7. Headless UI Physics: Decoupled Kinetic Containers (`useCarousel`, `useDeck`)

Following the behavior-first architecture (`docs/framework/architecture.md` §6), interactive containers and kinetic components strictly separate mathematical motion physics from visual markup.

### The Problem with Monolithic Containers

Standard mobile UI libraries often ship monolithic container components (e.g. `<Carousel>`, `<TinderCardDeck>`) with baked-in card wrappers, hardcoded padding, rigid gestures, and opinionated indicator styles. This creates friction:
1. **Agent DX / CSS Battles:** AI agents and developers waste effort overriding internal flex layouts, margins, or card frames to match design specifications.
2. **Gesture & Thread Blocking:** Coupling React component re-renders to high-frequency motion gestures causes frame drops on low-end devices.
3. **Inflexible Composition:** Monolithic components make it difficult to plug in custom dot paginators, parallax backgrounds, dynamic peek offsets, or custom badge overlays.

### The Headless UI Physics Philosophy

In `alambre`, containers are implemented as **headless physics hooks**:

| Layer | Responsibility | Owner |
| --- | --- | --- |
| **Physics & Kinematics** | Pure math (`calculateSnapInterval`, `calculateActiveIndex`, `getScrollTargetForIndex`), card offsets, clamped snap targets, velocity decay. | **`alambre`** |
| **Gesture & Motion State** | Reanimated worklets (`scrollHandler`), UI-thread shared values (`scrollX`, `swipeTranslation`, `activeIndex`), momentum listeners (`onMomentumScrollEnd`), auto-play intervals, stack history. | **`alambre`** |
| **JSX Presentation** | Markup (`<Animated.ScrollView>`, `<GestureDetector>`, `<Pressable>`), card layout, header/footer chrome, indicators, peek spacing, elevation, borders. | **Application** |
| **Visual Animation** | Interpolation worklets (`interpolate`, `interpolateColor`, `useAnimatedStyle`) for card scale, 3D tilt, fade, and shadow transforms. | **Application** |

### 1. Carousel Physics (`useCarousel`)

* **Framework role:** Provides mathematical snapping calculations and Reanimated scroll worklets on the UI thread without dictating card markup, peek spacing, or paginator design.
* **Application ownership:** The application mounts `<Animated.ScrollView>`, styles cards and container dimensions, and optionally renders custom indicators (demonstrated in `apps/playground/src/views/containers/CarouselTestbed.tsx`).
* **API contract & examples:** Documented in [`docs/reference/behaviors.md`](../reference/behaviors.md#5-usecarousel--math-kinematics).

### 2. Swipeable Card Deck Physics (`useDeck`)

* **Framework role:** Provides stack state tracking, swipe translation shared values, and history undo capabilities without dictating card styles or overlay badges.
* **Application ownership:** The application pairs the shared values with its gesture detectors and drives rotation or scale interpolation (demonstrated in `apps/playground/src/views/containers/DeckTestbed.tsx`).
* **API contract & examples:** Documented in [`docs/reference/behaviors.md`](../reference/behaviors.md#6-usedeck--swipeable-stack-kinematics).