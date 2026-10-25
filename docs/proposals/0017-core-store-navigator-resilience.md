---
id: RFC-0017
title: "Proposal 17: Core Store Unification, Navigator Resilience & Route Interception (`createStore`, `useNavigator`, `useNavigationGuard`)"
status: RESOLVED
author: @lead
scope: alambre (core, behaviors/navigator)
summary: "Core store unification, navigator resilience & route interception (`createStore`, `useNavigator`, `useNavigationGuard`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 17: Core Store Unification, Navigator Resilience & Route Interception (`createStore`, `useNavigator`, `useNavigationGuard`)
- **Status**: RESOLVED (Implemented & Validated)
- **Author**: @lead
- **Resolution**:
  - Re-exported unified `createStore` from `packages/alambre/src/core/store.ts` pointing to `src/core/create-store.ts`, adding `.get()` and `.set()` aliases to `Store<TState>` for 100% backward compatibility.
  - Refactored `navigator-provider.tsx` to consume `createStore` from `core/create-store.ts`.
  - Added additive `routeKey`, `currentRoute`, `currentSubpage`, `canGoBack`, `replace()`, `reset()`, and `popToTop()` to `NavigatorReturn`.
  - Implemented `useNavigationGuard` and `registerNavigationGuard` for intercepting Android hardware back and programmatic `previous()` / `popToTop()` navigation.
  - Exported `useNavigationGuard`, `registerNavigationGuard`, `navigatorActions`, and type `NavigationGuard` top-level in `packages/alambre/src/index.ts`.
  - Authored contract and unit tests in `packages/alambre/tests/behaviors/navigator.test.tsx` and updated `packages/alambre/tests/public-api.test.ts`.

### 1. Current Problem
- **Competing Store Implementations:** `packages/alambre/src/core/store.ts` (`{ get, set, subscribe }`) exists alongside `packages/alambre/src/core/create-store.ts` (`{ getState, setState, subscribe, dispose }`). `navigator-provider.tsx` imports from `core/store.ts`, while all capabilities import from `core/create-store.ts`. This duplicates internal store machinery and creates divergent subscriber semantics.
- **`pageKey` Desynchronization Bug:** In `navigator-provider.tsx`, `pageKey` is computed strictly from history: `state.stack.map((s) => s.page).join(', ')`. When at the root route (`stack: []`), `pageKey` evaluates to `""`. When navigating between sibling subpages with identical history prefixes (`home,sub1` -> back -> `home,sub2`), `pageKey` remains `"home"` in both states, preventing Reanimated `key={pageKey}` from triggering enter/exit layout transitions.
- **Multiple `BackHandler` Listeners:** `useNavigator()` registers a `hardwareBackPress` event listener on every component mount. If four components on a screen invoke `useNavigator()`, four redundant listeners are registered simultaneously. Furthermore, `AppNavigatorBody` in consumer apps registers another listener.
- **Missing Stack Operations & Navigation Interceptors:** `useNavigator` lacks `replace()`, `reset()`, and `popToTop()` primitives, as well as an interception hook (`useNavigationGuard(canLeave)`) to prevent accidental Android back-button dismissal during active multiplayer games or uncommitted form edits.

### 2. Proposed Solution
1. **Core Store Unification:**
   - Eliminate `packages/alambre/src/core/store.ts`.
   - Update `packages/alambre/src/behaviors/navigator/navigator-provider.tsx` to consume the standard `createStore` from `packages/alambre/src/core/create-store.ts`.
   - Add optional shallow equality comparison support in `useExternalStore` to prevent unnecessary component re-renders when returning derived selector values.
2. **Navigator State Resilience:**
   - Fix `pageKey` to uniquely include `state.currentPage` (e.g. `[...state.stack.map(s => s.page), state.currentPage].join(' > ')`).
   - Expose first-class properties `currentRoute: string`, `subpage?: string`, and `canGoBack: boolean`.
   - Consolidate Android `BackHandler` listener management into a single subscription held at the `NavigatorProvider` root level.
3. **Stack Operations & Navigation Guards:**
   - Add `replace(target, settings)`, `reset(target)`, and `popToTop()` actions.
   - Implement `useNavigationGuard(guard: () => boolean | Promise<boolean>)`, allowing active screens to intercept back navigation and prompt confirmation dialogs (`confirm()`) before popping the stack.

### 3. Pros & Cons
- **Pros:**
  - Fixes screen transition key bugs and eliminates duplicate Android hardware back handlers.
  - Eliminates duplicated store implementations across `packages/alambre/src/core/`.
  - Delivers essential navigation lifecycle hooks for games and forms.
- **Cons:**
  - Applications relying on the former empty string `pageKey` on root pages must adapt to the new unique route key.

---

[← Back to Proposals Index](./index.md)
