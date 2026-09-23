---
title: Base Template UI Baseline and Verification
summary: Visual and interaction baseline, layout contracts, and manual validation checklist for apps/base-template.
---

# Base Template: UI Baseline and Validation

This document establishes the interaction and visual baseline for `apps/base-template` (the generic application skeleton exported as `marcosdima/base-expo`).

---

## 1. Context & Architecture

`apps/base-template` serves as an opinionated, solid starting point for new applications built on top of `alambre`.

It must mirror the proven visual and interaction quality established in the other apps (`apps/colguetti` and `apps/cross-logic`) without adopting application-specific domain code.

Key architectural boundaries:
- **Unified Header Chrome:** When navigating to subpages or secondary routes (`Settings`, `Details`), `AppNavigatorBody` provides a unified navigation header row where the page title aligns horizontally and vertically with the back arrow.
- **Theme Switcher:** Follows the reference implementation in `ToggleLightDark.tsx` (`docs/project.md` §14), using animated shadow discs and dedicated light/dark icon color palettes matching application tokens (`light.border: #c9d6ea`, `dark.border: #32455f`, `light.circle: #0b525b`, `dark.circle: #9eebce`).
- **Transient Feedback:** `TemplateToast` features bounded entering (`FadeInDown`) and accelerating exit (`FadeOutUp`) animations, bounded by safe-area insets (`baseTop = Math.max(insets.top, 16)`), positioned cleanly below the header bar when navigation history exists, and smoothly gliding between header/non-header offsets when navigating while a toast is active.

---

## 2. Manual Validation Checklist

Follow this checklist during manual testing or emulator inspection (e.g. via `adb` per `docs/agents.md` §3):

### A. Main Menu (Home)
- [ ] **Header Entrance:** The top welcome card enters smoothly with `FadeInDown` without popping or flickering.
- [ ] **Navigation Buttons:** Navigation actions (Details, Show Toast, Settings) cascade into view with staggered entrance timing (`useStagger`).
- [ ] **Layout Stability:** Entering animations do not cause layout jumps, overflow clipping, or broken gaps in the container (`padding: 20, gap: 16`).
- [ ] **Press Feedback:** Tapping each button triggers the standard scale press feedback without delayed latency.

### B. Settings Screen
- [ ] **Header Alignment:** When navigating into Settings, the page title ("Ajustes" / "Settings") appears in the header row, strictly aligned vertically with the back arrow button.
- [ ] **Directional Alternation Motion:** The first semantic section (Language card) enters from the left (`FadeInLeft`), and the second section (Theme card) enters from the right (`FadeInRight`), keeping motion subtle (260ms) and independent from the header.
- [ ] **Theme Switcher Alignment:** The theme switcher toggle is horizontally centered (`alignSelf: 'center'`) within the Theme card.
- [ ] **Theme Switcher Colors:**
  - In **Light mode**: Background is `surfaceAlt` (`#e8eef7`), border is `theme.border` (`#c9d6ea`), active circle is `#0b525b`, Sun icon is amber (`#f59e0b`), Moon icon is `theme.muted` (`#5e6a7f`).
  - In **Dark mode**: Background is `surfaceAlt` (`#1d2d45`), border is `theme.border` (`#32455f`), active circle is `#9eebce`, Sun icon is light amber (`#ffc266`), Moon icon is `theme.muted` (`#9eb0c8`).
  - The animated disc/circle behind the icons dynamically interpolates color according to the active theme rather than staying constant.
- [ ] **Language Switching:** Tapping language chips ("ES" / "EN") dynamically updates all visible strings and immediately reflects the active chip style (`primarySoft` background, `primary` border).

### C. Details Screen
- [ ] **Header Alignment:** Subpage title ("Subpágina" / "Subpage") is cleanly displayed in the navigation header beside the back arrow.
- [ ] **Back Navigation:** Tapping the back arrow or triggering hardware back navigates back to Home with a smooth reverse transition (`FadeInLeft`), resetting scroll position.

### D. Toast Feedback & Safe Area
- [ ] **Entrance Animation:** Tapping "Mostrar toast" / "Show toast" summons the toast with an intentional `FadeInDown` entrance.
- [ ] **Exit Animation:** Tapping the dismiss button (✕) causes the toast to exit upwards with an accelerating `FadeOutUp` animation.
- [ ] **Status Bar Clearance:** On Home, the Toast never sits underneath the physical system status-bar area (battery, signal, notch). It respects `Math.max(insets.top, 16) + 10`.
- [ ] **Header Clearance:** On subpages (Settings, Details), the Toast sits at `baseTop + 66`, cleanly below the 56px navigation header without overlapping.
- [ ] **Navigation Transition Gliding:**
  - Trigger a Toast on Home and tap Settings while visible: the Toast smoothly glides down from its Home position to the subpage position over 250ms without jumping or popping.
  - Trigger a Toast on Settings and tap back while visible: the Toast smoothly glides up from the subpage position to the Home position over 250ms without jumping.
- [ ] **Touch Target:** The dismiss button respects accessibility guidelines with `hitSlop={12}`.

### E. Theme Consistency (Light & Dark)
- [ ] Test the entire checklist in **Light Theme**.
- [ ] Switch to **Dark Theme** and repeat to verify contrast, card borders (`theme.border`), and background colors (`theme.background`).

---

## 3. Extracted Experiments & Playground

The interactive animation playground, timing experiments, and advanced toast queue tests were extracted into a dedicated application: `apps/playground` (`@alambre/playground`).

See [docs/apps/playground.md](playground.md) for the experimental test suite, parameter sliders, curve selectors, and gliding verification tools. `apps/base-template` remains lean and clean as the starter template for new apps.
