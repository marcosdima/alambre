---
id: RFC-0003
title: "Proposal 3: Retiring the `TimePicker` Presentation Exception into Headless Wheel Physics (`useWheelPicker`)"
status: RESOLVED
author: @lead
scope: alambre (behaviors/wheel)
summary: "Retiring hardcoded TimePicker exception into headless wheel physics (`useWheelPicker`, `HorizontalPicker`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 3: Retiring the `TimePicker` Presentation Exception into Headless Wheel Physics (`useWheelPicker`)

### Status: RESOLVED
- Shipped headless wheel picker physics hook `useWheelPicker` in `packages/alambre/src/behaviors/wheel/useWheelPicker.ts`.
- Shipped presentation-neutral picker component `HorizontalPicker` in `packages/alambre/src/components/base/input/picker/HorizontalPicker.tsx`.
- Formally retired the provisional hardcoded `TimePicker` component from the public framework API, eliminating the presentation exception documented in `docs/framework/architecture.md` §6 and §8.
- Validated via unit/contract tests and exported top-level from `packages/alambre/src/index.ts`.

### 1. Current Problem
- `TimePicker` was explicitly documented in `docs/framework/ui-decisions.md` §2 as a **"provisional presentation exception"**: arrow glyphs ('▲', '▼'), typography, dimensions, inactive label colors, and default accent `#0057d8` were hardcoded in `alambre`.
- In practice, consumer applications rejected `alambre.TimePicker` in favor of gesture-driven inertia scrolling.
- Consequently, `TimePicker` was dead weight in `alambre`.

### 2. Proposed Solution
1. Extract the kinetic wheel physics into a headless hook:
   - **`useWheelPicker({ itemCount, selected, onSelect, rowHeight })`**:
     - UI-thread Reanimated shared values (`currentPosition`, `dragStartPos`).
     - Combined `Gesture.Pan()` with velocity inertia flicking and `Gesture.Tap()` for instant step selection.
     - Smooth spring settling (`withSpring`) and cyclic wrapping math (`((val % count) + count) % count`).
2. Retain pure time math helpers: `parseTimeValue`, `formatTimeValue`, `HOUR_RANGE`, `MINUTE_RANGE`.
3. Provide an optional presentation-neutral compound component:
   - `<WheelPicker.Root>`, `<WheelPicker.Column>`, `<WheelPicker.Item>` / `HorizontalPicker`.
4. Eliminate the provisional exception from `docs/framework/ui-decisions.md` §2.

### 3. Pros & Cons
- **Pros:**
  - Eliminates the only remaining hardcoded presentation exception in `alambre` (`ui.md` §2).
  - Generalizes wheel scrolling for hours, minutes, dates, pickers, and numeric counters.
- **Cons:**
  - Breaking change for the existing `TimePicker` component (permitted under pre-baseline `architecture.md` §9).

---

[← Back to Proposals Index](./index.md)
