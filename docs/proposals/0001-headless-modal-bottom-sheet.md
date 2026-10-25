---
id: RFC-0001
title: "Proposal 1: Headless Modal & Bottom Sheet Primitives (`useDialog`, `useBottomSheet`)"
status: RESOLVED
author: @lead
scope: alambre (behaviors/overlays)
summary: "Headless modal & bottom sheet primitives (`useDialog`, `useBottomSheet`) and compound overlays."
---

[← Back to Proposals Index](./index.md)

# Proposal 1: Headless Modal & Bottom Sheet Primitives (`useDialog`, `useBottomSheet`)

### Status: RESOLVED
- Shipped headless overlay behaviors `useBottomSheet` and `useDialog`, along with compound overlay components `BottomSheet` and `Dialog` in `packages/alambre/src/behaviors/overlays/`.
- Exported from `packages/alambre/src/index.ts` and validated with contract tests.
- Consumed across apps and showcase components.

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

[← Back to Proposals Index](./index.md)
