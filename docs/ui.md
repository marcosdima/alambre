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

## 2. Open questions

The following UI topics remain open and are deliberately not resolved here:

* Fate of currently opinionated primitives shipped in alambre (`Title`, `SubTitle`, `SafeAreaView`).
* Fate of `DefaultToastBody` and `NavigatorBody` (full opinionated UI shipped inside the framework).
* Fate of the concrete icon components and `ToggleLightDark` (hard-coded visual identity).
* Whether the behavior-first pattern validated with `Button` extends to other UI primitives.