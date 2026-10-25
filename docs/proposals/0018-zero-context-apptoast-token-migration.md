---
id: RFC-0018
title: "Proposal 18: Zero-Context `AppToast`, Presentation Boundary Cleanups & Semantic Token Migration (`AppToast`, `useToastGesture`, `alambre/ui`)"
status: RESOLVED
author: @lead
scope: alambre (behaviors/overlays), alambre/ui
summary: "Zero-context `AppToast`, presentation boundary cleanups & semantic token migration (`toast`, `AppToast`, `useToastGesture`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 18: Zero-Context `AppToast`, Presentation Boundary Cleanups & Semantic Token Migration (`AppToast`, `useToastGesture`, `alambre/ui`)
- **Status**: RESOLVED
- **Author**: @lead

### 1. Current Problem
- **Verbatim Duplication of `TemplateToast` (~800 LOC):** `apps/base-template/src/providers/toast.tsx` and `apps/playground/src/providers/toast.tsx` duplicate ~400 lines of complex Reanimated pan gestures, auto-dismiss countdown progress bars, and semantic tone badges. Unlike `ConfirmDialog` which was promoted to `alambre/ui`, toasts remain copy-pasted across apps.
- **Headless Boundary Leak in `NavigatorHost`:** `packages/alambre/src/behaviors/navigator/NavigatorHost.tsx` (283 lines) resides in the headless framework but defines hardcoded presentation styles (`arrowColor = 'black'`, `arrowBackgroundColor = 'rgba(15, 23, 42, 0.16)'`, and Spanish accessibility string `"Volver"`).
- **Hardcoded Hex Colors in `alambre/ui`:** `AppDialog.tsx`, `AppActionSheet.tsx`, and `AppTextInput.tsx` contain hardcoded hex values (`#ef4444`, `#f59e0b`, `#10b981`) instead of referencing semantic theme tokens (`theme.danger`, `theme.dangerSoft`, `theme.warning`, `theme.success`).
- **Context Overhead in Theme Switching:** `createLightDark` is an external store without React Context overhead, yet `alambre/ui` requires wrapping the entire root in `<ThemeProvider theme={{ ...theme, fontFamily }}>`, requiring applications to manually synchronize themes across module boundaries.

### 2. Proposed Solution
1. **Extract `useToastGesture` and Promote `AppToast`:**
   - Extract the headless pan-gesture math, dismiss thresholds, and progress timing into `useToastGesture` in `packages/alambre/src/behaviors/toast/`.
   - Export fully styled, theme-aware `AppToast` from `alambre/ui`, enabling apps to declare `<ToastHost ToastComponent={AppToast} />` in a single line.
2. **Move Navigator Presentation to `alambre/ui`:**
   - Migrate `NavigatorHost` styling out of headless `packages/alambre` into `alambre/ui` as `AppNavigatorShell` / `AppNavigatorBody`, leveraging `useTheme()`, `usePressKinetics()`, and `createLang` translations.
3. **Semantic Token Cleanups:**
   - Replace all hardcoded status colors in `AppDialog`, `AppActionSheet`, and `AppTextInput` with standard `theme.danger`, `theme.warning`, and `theme.success` tokens.
4. **Direct Store Binding for Themes:**
   - Allow `useTheme()` in `alambre/ui` to optionally bind directly to an external `ThemeStore` (`createLightDark`), deprecating mandatory `<ThemeProvider>` wrapping.

### 3. Pros & Cons
- **Pros:**
  - Deletes ~1,200 LOC of duplicated toast and navigation presentation boilerplate across applications.
  - Enforces the strict headless-to-presentation separation mandated by `architecture.md` §6.
  - Ensures all status cues strictly adhere to custom app palette overrides.
- **Cons:**
  - Requires updating root layout imports across `apps/base-template` and `apps/playground`.

---

[← Back to Proposals Index](./index.md)
