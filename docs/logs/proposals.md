---
title: Architectural Proposals & Technical Roadmap
summary: High-impact proposals to modernize alambre with compound components, headless overlay utilities, strict typing, and technical debt remediation.
---

# Architectural Proposals & Technical Roadmap

This document captures high-impact architectural improvements for `alambre` discovered during the comprehensive codebase audit. Each proposal addresses demonstrated friction, code duplication, or type-safety limitations across `packages/alambre` and consumer apps (`apps/colguetti`, `apps/base-template`, `apps/playground`, `apps/cross-logic`).

---

## Proposal 1: Headless Modal & Bottom Sheet Primitives (`useDialog`, `useBottomSheet`)

### 1. Current Problem
- `AppActionSheet.tsx` (413 lines) and `AppDialog.tsx` (318 lines) are copied verbatim across `apps/colguetti`, `apps/base-template`, and `apps/playground`—representing over **1,400 lines of duplicated code**.
- Both components implement intricate Reanimated worklets (spring physics, backdrop fade interpolation, overshoot skirt, drag-to-dismiss velocity thresholds) and mobile OS quirks (`statusBarTranslucent`, `navigationBarTranslucent`, `KeyboardAvoidingView` offsets).
- `ConfirmHost` and `ToastHost` are headless overlay hosts in `alambre`, but `alambre` offers no primitives for modal dialogs or bottom sheets, forcing every application to re-engineer gesture physics from scratch.

### 2. Proposed Solution
Extract pure headless overlay behaviors into `packages/alambre/src/behaviors/` or `src/components/`:
1. **`useBottomSheet(options)`**:
   - Manages Pan drag-to-dismiss gesture, UI-thread `translateY` shared value, backdrop opacity interpolation (`0 -> 1`), overshoot resistance math, and settle velocity thresholds.
   - Exposes: `{ panGesture, translateY, backdropOpacity, close, snapTo, isMounted }`.
   - Optional compound wrapper: `<BottomSheet.Root>`, `<BottomSheet.Backdrop>`, `<BottomSheet.Handle>`, `<BottomSheet.Content>`.
2. **`useDialog(options)`**:
   - Manages scale/fade spring transitions (`cardScale: 0.92 -> 1`, `backdropOpacity: 0 -> 1`), accessible backdrop press handling, and accessibility bindings (`role="alert"` / `role="dialog"`).
   - Exposes: `{ isMounted, animatedBackdropStyle, animatedCardStyle, close }`.
3. Application layer (`AppActionSheet`, `AppDialog` in `base-template` and apps) becomes a thin presentation shell (~45 LOC) styling colors, typography, and badges.

### 3. Pros & Cons
- **Pros:**
  - Eliminates >1,400 LOC of duplicated Reanimated gesture logic across apps.
  - Standardizes Android edge-to-edge windowing (`navigationBarTranslucent`) and swipe-to-dismiss physics across the ecosystem.
  - Directly powers `ConfirmHost` and action menus with uniform physics.
- **Cons:**
  - Requires maintaining gesture dependencies (`react-native-gesture-handler`) in overlay contracts.

---

## Proposal 2: Compound Form Primitives & Focus Chaining Architecture (`Input`, `Stepper`, `Slider`)

### 1. Current Problem
- **Broken Focus Chaining:** `Input.tsx` does not forward native refs via `React.forwardRef`. This breaks `onSubmitEditing` focus chaining (`nextRef.current?.focus()`), violating Discovery `[UI-06]`. Because of this, every app (`colguetti`, `base-template`, `playground`) completely abandoned `alambre.Input` and wrote a custom 412 LOC `AppTextInput.tsx` directly over RN's `TextInput`.
- **Lack of Slots:** Form inputs regularly need labels, leading/trailing icons, clear buttons, password visibility toggles, and validation error messages. `alambre.Input` is a bare `RNTextInput` wrapper without any of these capabilities.
- **Monolithic Render-Props in `Stepper` and `Slider`:** Both components force consumers into a single monolithic callback (`children(state)`), requiring consumers to manually wire decrement buttons, value textboxes, increment buttons, tracks, and thumbs from scratch.

### 2. Proposed Solution
Evolve form inputs into accessible, ref-forwarding **Compound Components**:
1. **`Input` Compound Family:**
   - `<Input.Root>`: Context holder managing `focused`, `disabled`, `error`, `hasValue`.
   - `<Input.Field ref={ref}>`: Ref-forwarded native text field with focus/blur tracking.
   - `<Input.Label>`: Accessible label associated via accessibility contracts.
   - `<Input.Affix>` / `<Input.ClearButton>` / `<Input.PasswordToggle>`: Standardized slots for interactive decorations.
   - `<Input.Feedback>`: Accessible validation error or helper text (`aria-invalid`, `role="alert"`).
2. **`Stepper` Compound Family:**
   - `<Stepper.Root min={0} max={10} value={val} onChange={setVal}>`
   - `<Stepper.Decrement>` (auto-disabled at min), `<Stepper.Value format={fn}>`, `<Stepper.Increment>` (auto-disabled at max).
3. **`Slider` Compound Family:**
   - `<Slider.Root>`: Coordinates touch responder layout bounds and step snapping.
   - `<Slider.Track>`, `<Slider.Range>` (active fill), `<Slider.Thumb>`.

### 3. Pros & Cons
- **Pros:**
  - Enables clean declarative composition without cumbersome render-prop boilerplate.
  - Automatically satisfies accessibility contracts (`role="spinbutton"`, `role="adjustable"`, `aria-invalid`).
  - Resolves Discovery `[UI-06]` and allows `AppTextInput` in all apps to wrap `alambre.Input` instead of bypassing it.
- **Cons:**
  - Slightly larger public component surface (requires exporting subcomponents on the parent namespace).

---

## Proposal 3: Retiring the `TimePicker` Presentation Exception into Headless Wheel Physics (`useWheelPicker`)

### 1. Current Problem
- `TimePicker` is explicitly documented in `docs/framework/ui-decisions.md` §2 as a **"provisional presentation exception"**: arrow glyphs ('▲', '▼'), typography, dimensions, inactive label colors, and default accent `#0057d8` are hardcoded in `alambre`.
- In practice, the reference application (`apps/colguetti`) completely rejected `alambre.TimePicker` and built `SwipeableTimePicker.tsx` (329 LOC) with Reanimated gestures, inertia flick momentum, and multi-cycle infinite scrolling.
- Consequently, `TimePicker` is dead weight in `alambre`: imported by zero apps in the monorepo.

### 2. Proposed Solution
1. Extract the kinetic wheel physics into a headless hook:
   - **`useWheelPicker({ itemCount, selected, onSelect, rowHeight })`**:
     - UI-thread Reanimated shared values (`currentPosition`, `dragStartPos`).
     - Combined `Gesture.Pan()` with velocity inertia flicking and `Gesture.Tap()` for instant step selection.
     - Smooth spring settling (`withSpring`) and cyclic wrapping math (`((val % count) + count) % count`).
2. Retain pure time math helpers: `parseTimeValue`, `formatTimeValue`, `HOUR_RANGE`, `MINUTE_RANGE`.
3. Provide an optional presentation-neutral compound component:
   - `<WheelPicker.Root>`, `<WheelPicker.Column>`, `<WheelPicker.Item>`.
4. Migrate `apps/colguetti/src/components/SwipeableTimePicker.tsx` to consume `useWheelPicker`, proving reuse and eliminating the provisional exception from `docs/framework/ui-decisions.md` §2.

### 3. Pros & Cons
- **Pros:**
  - Eliminates the only remaining hardcoded presentation exception in `alambre` (`ui.md` §2).
  - Generalizes wheel scrolling for hours, minutes, dates, pickers, and numeric counters.
  - Reconciles framework with actual app adoption in Colguetti.
- **Cons:**
  - Breaking change for the existing `TimePicker` component (permitted under pre-baseline `architecture.md` §9).

---

## Proposal 4: First-Class Type Safety & State Modernization (`createConfig`, `useNavigator`, `NavigatorTypes`)

### 1. Current Problem
- **`createConfig` forced string values:** `ConfigState<T extends Record<string, string>>` forces all config keys and values to be `string`. Applications cannot store booleans (`notificationsEnabled: boolean`), numbers (`refreshInterval: number`), or objects without manual serialization. `saveField` accepts `value: string` instead of `value: T[K]`. Furthermore, it lacks a `loading` / `hydrated` indicator, risking flash of unhydrated content.
- **Legacy Namespace Leakage (`NavigatorTypes`):** `NavigatorTypes` is the only remaining subsystem exported as a blanket `export * as NavigatorTypes` namespace from `types/index.ts` (violating `architecture.md` §8 and audit checklist item 1).
- **Untyped Routing in `useNavigator`:** Route keys and targets are untyped `string`. Calling `navigate('nonExistent')` fails silently or causes runtime errors without TypeScript compile-time feedback. There is no first-class contract for route parameters (forcing applications to create ad-hoc contexts like `RouteIntent`).
- **`createLang` loose type:** `Langs = Record<string, object>` types translation objects as `object`, losing type safety on translated strings unless cast manually.

### 2. Proposed Solution
1. **Modernize `createConfig`:**
   - Expand to `T extends Record<string, any>`, supporting booleans, numbers, and objects.
   - Strictly type `saveField<K extends keyof T>(field: K, value: T[K])`.
   - Expose `loading: boolean` or `hydrated: boolean` in `useConfig` to match `createCollection`.
2. **Dismantle `NavigatorTypes` Namespace:**
   - Export first-class public types in `src/index.ts`: `Page`, `NavigatorObject`, `NavigatorReturn`, `NavigatorProviderProps`, `NavigationSettings`.
3. **Type-Safe Routing & Route Parameters:**
   - Parameterize `useNavigator<TRoutes>`: `navigate<K extends keyof TRoutes>(route: K, params?: TRoutes[K])`.
   - Support optional route intent / parameter passing directly through navigation actions.
4. **Strict `createLang` Translation Generics:**
   - Allow `createLang<T extends Record<string, L>, L extends Record<string, any>>` to preserve dictionary intellisense.

### 3. Pros & Cons
- **Pros:**
  - Zero runtime overhead; eliminates TypeScript strictness leaks.
  - Resolves the last lingering blanket namespace export in `architecture.md` §8.
  - Gives complete autocomplete and compile-time validation for app navigation and configuration.
- **Cons:**
  - Tightening types may require minor type annotations in existing app providers.

---

## Proposal 5: Formalizing the Headless Swipe-to-Action Primitive (`useSwipeableRow`)

### 1. Current Problem
- An untracked file `packages/alambre/src/hooks/use-swipeable-row.ts` was started, but it currently has 4 ESLint errors (`@typescript-eslint/consistent-type-imports`, `comma-dangle`, `no-trailing-spaces`), is not exported in `src/index.ts`, has no tests, and is not registered in `docs/logs/discoveries.md`.

### 2. Proposed Solution
- Adopt and formalize `useSwipeableRow` as a headless physics hook:
  - Fix the 4 ESLint errors and export it properly.
  - Document in `docs/logs/discoveries.md` under [F-10] and add contract tests in `packages/alambre/tests/hooks/use-swipeable-row.test.ts`.

### 3. Pros & Cons
- **Pros:** Cleans up untracked debt and ESLint failures; promotes a battle-tested gesture pattern into a headless hook.
- **Cons:** Requires thorough multi-touch and emulator gesture testing to ensure no responder contention across lists.
