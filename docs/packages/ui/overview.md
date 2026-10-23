---
title: UI Architecture & Decisions
summary: Tactile UI direction, headless behavior vs presentation boundary, and component decisions for @some-alambre/ui and alambre.
---

# UI Architecture & Decisions

This document records the foundational decisions governing the relationship between the headless primitives in `packages/alambre` and the tactile design system in `packages/ui` (`@some-alambre/ui`).

Core principles live in `docs/packages/alambre/architecture.md`. This file captures how those principles materialize into concrete UI components.

---

## 1. Headless Primitives vs Tactile Design System

The Alambre repository separates UI into two distinct layers:

1. **Headless Behavior & Physics (`packages/alambre`):**
   Defines behavior, accessibility state, responder math, UI-thread worklets, and gesture life cycles without opinionated visual styles or hardcoded tokens.
2. **Tactile Design System (`packages/ui` / `@some-alambre/ui`):**
   Composes the headless primitives into fully styled, accessible, themed components (`AppButton`, `AppCard`, `AppTextInput`, `AppDialog`, `AppSwitch`, `AppSlider`, etc.) that automatically adapt to light/dark themes and typography.

---

## 2. Button — Behavior-First Primitive

* `Button` is the behavior-first interaction primitive in `packages/alambre`: **alambre defines behavior and contracts; presentation components define visual identity.**
* `Button` is exported top-level from `alambre` (`import { Button } from 'alambre'`).
* In `@some-alambre/ui`, `AppButton` (and alias `Button`) wraps `alambre.Button` to provide tactile styles, elevation, loading spinners, icons, and variants (`solid`, `soft`, `outline`, `ghost`).

### Responsibilities of Headless `Button`
* `loading`, `disabled`, and `pressed` state tracking.
* Interaction blocking during loading or disabled states.
* Accessibility semantics (`role="button"`, `accessibilityState.busy`, `accessibilityState.disabled`).
* Exposing state to consumers via children render prop and style callbacks.

### Presentation Responsibilities (Owned by `@some-alambre/ui` & Apps)
* Visual variants (`solid`, `soft`, `outline`, `ghost`).
* Sizing (`sm`, `md`, `lg`), colors, typography, borders, and margins.

---

## 3. Icons: Decoupled Graphic Primitives

The concrete icons (`Sun`, `Moon`, `Arrow`, `Cross`, `Tick`) remain in `alambre`, but are decoupled from hard-coded application presentation:

* `color` is required (no hard-coded `black`/`orange`/`gray` strokes and fills); optional `fill` is accepted where the shape supports it.
* Animation timing and behavior are driven by the `iconAnimation` configuration (`useIconAnimation`), not by fixed durations.
* Geometry stays consistent and reproducible.
* The icon layer is covered by contract tests in `packages/alambre/tests/components/icons-base.test.tsx` and `packages/alambre/tests/components/icons.test.tsx`.

---

## 4. Behavior-First Inputs: `Stepper`, `Slider`, and `Input`

Headless inputs in `packages/alambre` strictly isolate state math:
* **`Stepper` & `useStepper`**: Numeric stepping logic, min/max clamping, precision handling, and `role="spinbutton"`.
* **`Input`**: Managed focus/error/disabled states and accessible semantics over `TextInput`.
* **`Slider` & `useSlider`**: Continuous or stepped numeric calculation, responder gestures, and ratio calculation.
* **`SegmentedControl` & `useSelect`**: Discrete single-option selection and radio accessibility.

These primitives are wrapped by `@some-alambre/ui` into `AppStepper`, `AppTextInput`, `AppSlider`, and `AppSegmentedControl`.

---

## 5. Headless Animation Timing: `useStagger`

Following the principle that the framework defines behavior while presentation defines visuals:
* `useStagger` and `calculateStaggerDelay` provide headless stagger timing coordination across sequential elements.
* **Non-responsibilities:** The framework does NOT impose visual entrance animations. Applications pair computed delays with Reanimated builders or `@some-alambre/ui`'s `AnimatedCascade`.
* **Accessibility:** Automatically integrates with `useReducedMotion()`. When reduced motion is preferred by the user, delays return `0` immediately.

---

## 6. Gesture Contention & Hierarchy in Compound Rows

When designing compound list rows that support swipe-to-action behaviors (such as `SwipeableItemRow` / swipe-to-delete), touch responder hierarchy rules must be strictly respected:

### Prohibited: Nested horizontal drag responders
Embedding child components that register continuous horizontal pan gestures (such as gesture-driven carousels or horizontal sliders) inside a list row that itself listens to horizontal swipes creates unresolvable responder contention in `react-native-gesture-handler`. The inner pan gesture steals the drag events or locks up the parent row.

### Adopted solutions for compound rows
1. **Static preview summaries with overflow badges:** Display up to a fixed number of static preview chips followed by a `+N` badge.
2. **Discrete tap controls:** Use discrete tap controls (such as steppers or chevrons) with bounded touch hit bounds (`hitSlop`), never continuous pan drag responders.
3. **Dedicated screen / modal for interactive collections:** When complex gesture-driven reordering or sliding is necessary, the interaction belongs on a dedicated subpage or modal dialog.

---

## 7. Headless UI Physics: Decoupled Kinetic Containers (`useCarousel`, `useDeck`)

Interactive containers and kinetic components strictly separate mathematical motion physics from visual markup.

| Layer | Responsibility | Owner |
| --- | --- | --- |
| **Physics & Kinematics** | Pure math (`calculateSnapInterval`, `calculateActiveIndex`, `getScrollTargetForIndex`), card offsets, clamped snap targets, velocity decay. | **`alambre`** |
| **Gesture & Motion State** | Reanimated worklets (`scrollHandler`), UI-thread shared values (`scrollX`, `swipeTranslation`, `activeIndex`), momentum listeners, auto-play intervals, stack history. | **`alambre`** |
| **JSX Presentation** | Markup (`<Animated.ScrollView>`, `<GestureDetector>`, `<Pressable>`), card layout, header/footer chrome, indicators, peek spacing, elevation, borders. | **`@some-alambre/ui` / Apps** |
| **Visual Animation** | Interpolation worklets (`interpolate`, `interpolateColor`, `useAnimatedStyle`) for card scale, 3D tilt, fade, and shadow transforms. | **`@some-alambre/ui` / Apps** |

### 1. Carousel Physics (`useCarousel`)
* **Framework role:** Snapping calculations and Reanimated scroll worklets on the UI thread without dictating card markup or paginator design.
* **Application ownership:** Mounts `<Animated.ScrollView>`, styles cards and container dimensions, and optionally renders custom indicators (demonstrated in `apps/playground/src/views/containers/CarouselTestbed.tsx`).
* **API contract & examples:** Documented in [`docs/packages/alambre/behaviors.md`](../alambre/behaviors.md).

### 2. Swipeable Card Deck Physics (`useDeck`)
* **Framework role:** Stack state tracking, swipe translation shared values, and history undo capabilities.
* **Application ownership:** Pairs shared values with gesture detectors and drives rotation or scale interpolation (demonstrated in `apps/playground/src/views/containers/DeckTestbed.tsx`).
* **API contract & examples:** Documented in [`docs/packages/alambre/behaviors.md`](../alambre/behaviors.md).

---

## 8. Platform Traps (Negative Knowledge)

Short, non-obvious engine and OS defects that unit tests cannot catch:

* **Transparent text is not a layout probe:** In Fabric (Android `ForegroundColorSpan`), `color: 'transparent'` normalizes to `0`, which `SharedColor` treats as undefined, so `TextAttributes::apply` falls back to the parent foreground color and the text renders fully opaque. Do not pre-layout hidden text this way; use `textBreakStrategy="simple"` with progressive string slicing and a container `minHeight`.
* **Reanimated exit animations teleport on gesture dismiss:** Cards that combine swipe-to-dismiss with `exiting={FadeOut*}` snap back to the layout origin on unmount. Split into an outer wrapper that suppresses the exit animation once the gesture dismissed the card, and an inner interactive card (see `apps/base-template/src/providers/toast.tsx`).
* **Compound controls need a single accessibility node:** When a row and its switch are both accessible, TalkBack/VoiceOver announce the toggle twice. Make the outer row the only accessible node and mark the visual track `accessible={false}` with `pointerEvents="none"` (see `AppSwitch.tsx`).
* **Wrapped inputs must forward refs:** Wrapping `TextInput` in a styled shell without `forwardRef` + `useImperativeHandle` breaks `onSubmitEditing` focus chaining (see `AppTextInput.tsx`).
* **Do not interpolate `withSpring`/`withTiming`:** See `docs/guidelines/agents.md` §5 (Reanimated Syntax Guardrail).
