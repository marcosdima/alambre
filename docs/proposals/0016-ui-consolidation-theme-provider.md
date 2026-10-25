---
id: RFC-0016
title: "Proposal 16: `@alambre/ui` Consolidation, `ThemeProvider` Unification & Hygiene"
status: RESOLVED
author: @lead
scope: alambre/ui (@some-alambre/ui)
summary: "`@alambre/ui` consolidation, `ThemeProvider` unification & playground hygiene."
---

[← Back to Proposals Index](./index.md)

# Proposal 16: `@alambre/ui` Consolidation, `ThemeProvider` Unification & Hygiene
- **Status**: RESOLVED (Implemented across `packages/ui`, `apps/playground`, `README.md`, `docs/guidelines/agents.md`, and `scripts/e2e.sh`)
- **Author**: @lead

### 1. Current Problem
- **UI Component Duplication in `apps/playground`:** `apps/playground/src/components/` still maintains local copies of `AppButton.tsx`, `AppCard.tsx`, `AppBadge.tsx`, `AppSegmentedControl.tsx`, `AppSlider.tsx`, and `AppTitle.tsx` that duplicate `@alambre/ui`. This occurred because `apps/playground/src/navigator/Root.tsx` does not wrap its tree in `@alambre/ui`'s `<ThemeProvider theme={theme}>` (unlike `apps/base-template`).
- **Kinetic Drift Between `playground` and `@alambre/ui`:** In Proposal 7, `apps/playground`'s local `AppButton` and `AppCard` were refactored to consume `usePressKinetics`, but `packages/ui/src/components/AppButton.tsx` and `AppCard.tsx` still use legacy manual `useSharedValue(1)` + `withTiming`/`withSpring` boilerplate.
- **Missing Test Runner in `@alambre/ui` & Stale Archive References:** `packages/ui/package.json` has `lint` and `typecheck` scripts but no `test` script or contract tests. Additionally, `README.md`, `docs/guidelines/agents.md`, and `scripts/e2e.sh` still contain references to archived apps (`apps/colguetti`, `apps/cross-logic`).

### 2. Proposed Solution
1. **Upgrade `@alambre/ui` Primitives:** Refactor `packages/ui/src/components/AppButton.tsx` and `AppCard.tsx` to consume `usePressKinetics` from `alambre`.
2. **Unify `apps/playground` on `@alambre/ui`:** Mount `<ThemeProvider theme={theme}>` in `apps/playground/src/navigator/Root.tsx`, re-point playground imports to `@alambre/ui`, and deduplicate `apps/playground/src/components/App*.tsx` files into thin re-exports of `@alambre/ui`.
3. **Clean Stale Docs:** Update documentation/scripts to reflect active workspace apps (`base-template`, `playground`, and the upcoming card game app).

### 3. Pros & Cons
- **Pros:**
  - Ensures the upcoming Card Game app consumes a single, battle-tested `@alambre/ui` package with `usePressKinetics` already integrated.
  - Eliminates ~1,300 lines of duplicated UI wrapper code in `apps/playground`.
- **Cons:**
  - Requires a quick visual/test pass across `apps/playground` views after switching imports to `@alambre/ui`.

---

[← Back to Proposals Index](./index.md)
