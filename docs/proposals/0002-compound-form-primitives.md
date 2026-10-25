---
id: RFC-0002
title: "Proposal 2: Compound Form Primitives & Focus Chaining Architecture (`Input`, `Stepper`, `Slider`)"
status: RESOLVED
author: @lead
scope: alambre (components/base)
summary: "Compound form primitives & focus chaining architecture (`Input`, `Stepper`, `Slider`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 2: Compound Form Primitives & Focus Chaining Architecture (`Input`, `Stepper`, `Slider`)

### Status: RESOLVED
- Shipped compound form components `Input` (`Root`, `Field`, `Label`, `Affix`, `ClearButton`, `PasswordToggle`, `Feedback`), `Stepper` (`Root`, `Decrement`, `Value`, `Increment`), and `Slider` (`Root`, `Track`, `Range`, `Thumb`) in `packages/alambre/src/components/base/`.
- Native `forwardRef` enabled for seamless focus chaining.
- Exported in `src/index.ts` and covered by unit/contract tests.

### 1. Current Problem
- **Broken Focus Chaining:** `Input.tsx` does not forward native refs via `React.forwardRef`. This breaks `onSubmitEditing` focus chaining (`nextRef.current?.focus()`; see `docs/framework/ui-decisions.md` §8). Because of this, every app (`colguetti`, `base-template`, `playground`) completely abandoned `alambre.Input` and wrote a custom 412 LOC `AppTextInput.tsx` directly over RN's `TextInput`.
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
  - Resolves the focus-chaining trap (`docs/framework/ui-decisions.md` §8) and allows `AppTextInput` in all apps to wrap `alambre.Input` instead of bypassing it.
- **Cons:**
  - Slightly larger public component surface (requires exporting subcomponents on the parent namespace).

---

[← Back to Proposals Index](./index.md)
