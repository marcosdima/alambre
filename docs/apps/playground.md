---
title: Playground App Verification & Documentation
summary: Interactive proving ground and test app for animations, toast queue behaviors, and behavior-first UI primitives.
---

# Playground (`apps/playground`)

`apps/playground` (`@alambre/playground`) is the dedicated interactive proving ground in the monorepo. It isolates UI experiments, animation tuning, and edge-case testing so that `apps/base-template` remains a clean starter template.

---

## 1. Views and Capabilities

### A. Animation Playground (`AnimationTest`)
Interactive screen to test motion timing, distance magnitudes, easing curves, and engines:

* **Magnitudes via `AppSlider`:**
  * **Duration**: `50ms` - `1000ms` (step `25ms`).
  * **Delay / Stagger**: `0ms` - `500ms` (step `25ms`).
  * **Distance / Offset**: `5px` - `120px` (step `5px`).
  * **Initial Scale**: `0.50` - `1.00` (step `0.05`, active in Pop / Zoom mode).
* **Patterns via `AppSegmentedControl`:**
  * `Alternado`: Left / Right alternating entrances.
  * `Cascada`: Sequential top-to-bottom cascade.
  * `Pop / Zoom`: Scale + opacity entering transition.
* **Easing Curves via `AppSelect` Dropdown:**
  * `Cubic Out`: Smooth, natural interface curve.
  * `Quad Out`: Uniform acceleration and quick response.
  * `Back Out (Springy)`: Elastic overshoot rebound.
  * `Bounce Out`: Physical multi-bounce response.
* **Render Engines:**
  * `Reanimated Presets`: Built-in entering builders (`FadeInLeft`, `FadeInRight`, `FadeInDown`).
  * `Dynamic Keyframe`: Dynamic runtime `Keyframe` definitions.
* **Slow Motion Toggle:**
  * Switch between `1.0x` and `0.25x` (4x slower) to inspect frame transitions frame-by-frame.
* **Live Replay (`↺`):**
  * Remounts the preview container with Alambre vector icons (`Sun`, `Zap`, `Tick`), tags, and parameter readout footer.

### B. Toast Laboratory (`ToastTest`)
Proving ground for transient feedback and layout adaptation:

* **Duration Slider:** Test custom toast durations from `1000ms` to `8000ms`.
* **Queue Testing:** Test enqueuing multiple items (3 toasts) and inspecting active `queueLength`.
* **Dismiss & Clear:** Verify `dismiss()` for immediate transition to the next queue item, and `clear()` to cancel the entire pending queue.
* **Navigation Gliding:** Launch a long-running toast on Home or Subpage and navigate across screens to verify that the Toast smoothly glides vertically (`insets.top` vs `headerHeight`) without unmounting or snapping.

### C. Reference UI Components Showcase
Hosts reference implementations of `alambre` primitives:
* `AppButton` (wrapping `alambre.Button`)
* `AppSlider` (wrapping `alambre.Slider` / `alambre.useSlider`)
* `AppStepper` (wrapping `alambre.Stepper` / `alambre.useStepper`)
* `AppSegmentedControl` (wrapping `alambre.SegmentedControl` / `alambre.useSelect`)
* `AppSelect` (dropdown select component)
* `ToggleLightDark` (theme switcher)

---

## 2. Validation

Run linting, typechecking, and tests:
```bash
pnpm --filter @alambre/playground lint
pnpm --filter @alambre/playground typecheck
pnpm --filter @alambre/playground test
```
To run the playground app locally:
```bash
pnpm --filter @alambre/playground start
```
