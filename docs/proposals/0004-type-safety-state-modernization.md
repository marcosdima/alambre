---
id: RFC-0004
title: "Proposal 4: First-Class Type Safety & State Modernization (`createConfig`, `useNavigator`, `createLang`)"
status: RESOLVED
author: @lead
scope: alambre (capabilities, navigator)
summary: "Type safety & state modernization (`createConfig`, `useNavigator`, `createLang`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 4: First-Class Type Safety & State Modernization (`createConfig`, `useNavigator`, `createLang`)

### Status: RESOLVED
- Modernized `createConfig` with generic typing (`T extends Record<string, unknown>`), typed `saveField<K extends keyof T>`, automatic JSON serialization for booleans/numbers/objects, and exposed `loading: boolean` state.
- Dismantled legacy blanket namespace export `NavigatorTypes`, directly exporting `Page`, `NavigatorObject`, `NavigatorReturn`, `NavigatorProviderProps`, and `NavigationSettings` from `packages/alambre/src/index.ts`.
- Parameterized `useNavigator<TRoute, TSubpage, TParams>` to support type-safe route names, subpages, and navigation parameters.
- Upgraded `createLang` with generic dictionary inference (`<T extends Record<string, L>, L extends LangDictionary = T[keyof T]>`) and exported `LangDictionary`, `Langs`, `LangState`, `UseLangType`, and `CreateLangReturn` in `packages/alambre/src/index.ts`, preserving dictionary intellisense across apps without manual type assertions.
- Contract-tested in `packages/alambre/tests/public-api.test.ts` and `packages/alambre/tests/capabilities/create-lang.test.tsx`.

### 1. Current Problem
- **`createConfig` forced string values:** `ConfigState<T extends Record<string, string>>` forced all config keys and values to be `string`. Applications could not store booleans, numbers, or objects without manual serialization. `saveField` accepted `value: string` instead of `value: T[K]`. Furthermore, it lacked a `loading` indicator.
- **Legacy Namespace Leakage (`NavigatorTypes`):** `NavigatorTypes` was exported as a blanket `export * as NavigatorTypes` namespace from `types/index.ts`.
- **Untyped Routing in `useNavigator`:** Route keys and targets were untyped `string`.
- **`createLang` loose type:** `Langs = Record<string, object>` typed translation objects as `object`, losing type safety on translated strings unless cast manually.

### 2. Proposed Solution
1. **Modernize `createConfig`:**
   - Expand to `T extends Record<string, unknown>`, supporting booleans, numbers, and objects.
   - Strictly type `saveField<K extends keyof T>(field: K, value: T[K])`.
   - Expose `loading: boolean` in `useConfig`.
2. **Dismantle `NavigatorTypes` Namespace:**
   - Export first-class public types in `src/index.ts`: `Page`, `NavigatorObject`, `NavigatorReturn`, `NavigatorProviderProps`, `NavigationSettings`.
3. **Type-Safe Routing & Route Parameters:**
   - Parameterize `useNavigator<TRoutes>`: `navigate<K extends keyof TRoutes>(route: K, params?: TRoutes[K])`.
   - Support optional route parameters through navigation actions.
4. **Strict `createLang` Translation Generics:**
   - Allow `createLang<T extends Record<string, L>, L extends Record<string, any>>` to preserve dictionary intellisense.

### 3. Pros & Cons
- **Pros:**
  - Zero runtime overhead; eliminates TypeScript strictness leaks.
  - Resolves the last lingering blanket namespace export in `architecture.md` §8.
  - Gives complete autocomplete and compile-time validation for app navigation and configuration.
- **Cons:**
  - None; fully backward-compatible with optional generics.


---

[← Back to Proposals Index](./index.md)
