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
- **Theme Switcher:** Follows the reference implementation in `ToggleLightDark.tsx` (`docs/project.md` §14), using animated shadow discs and dedicated light/dark icon color palettes (`light.circle: #0b525b`, `dark.circle: #9eebce`).
- **Transient Feedback:** `TemplateToast` features bounded entering (`FadeInDown`) and accelerating exit (`FadeOutUp`) animations, positioned cleanly below the header bar when navigation history exists.

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
- [ ] **Section Animations:** The Language card and Theme card enter with sequential, intentional `FadeInDown` motion rather than a single blunt block fade.
- [ ] **Theme Switcher Alignment:** The theme switcher toggle is horizontally centered (`alignSelf: 'center'`) within the Theme card.
- [ ] **Theme Switcher Colors:**
  - In **Light mode**: Background is white, border dark, active circle is `#0b525b`, Sun icon is amber (`#f59e0b`), Moon icon is neutral gray (`#6b7280`).
  - In **Dark mode**: Background is dark `#222`, border white, active circle is `#9eebce`, Sun icon is light amber (`#ffc266`), Moon icon is soft blue-gray (`#9eb0c8`).
- [ ] **Language Switching:** Tapping language chips ("ES" / "EN") dynamically updates all visible strings and immediately reflects the active chip style (`primarySoft` background, `primary` border).

### C. Details Screen
- [ ] **Header Alignment:** Subpage title ("Subpágina" / "Subpage") is cleanly displayed in the navigation header beside the back arrow.
- [ ] **Back Navigation:** Tapping the back arrow or triggering hardware back navigates back to Home with a smooth reverse transition (`FadeInLeft`), resetting scroll position.

### D. Toast Feedback
- [ ] **Entrance Animation:** Tapping "Mostrar toast" / "Show toast" summons the toast with an intentional `FadeInDown` entrance.
- [ ] **Exit Animation:** Tapping the dismiss button (✕) causes the toast to exit upwards with an accelerating `FadeOutUp` animation.
- [ ] **Positioning:**
  - On Home (no previous pages): Toast renders at `top: 12`.
  - On subpages (Settings, Details): Toast automatically offsets to `top: 72` so it does not overlap the navigation header.
- [ ] **Touch Target:** The dismiss button respects accessibility guidelines with `hitSlop={12}`.

### E. Theme Consistency (Light & Dark)
- [ ] Test the entire checklist in **Light Theme**.
- [ ] Switch to **Dark Theme** and repeat to verify contrast, card borders (`theme.border`), and background colors (`theme.background`).
