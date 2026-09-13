# Changelog

All notable changes to `alambre` are documented in this file.

The package is currently in a **pre-baseline phase**: the public contract is still being defined and the current `1.0.x` version series is a frozen placeholder (see `docs/architecture.md` §9). SemVer constraints do not apply until a baseline is declared.

## Unreleased — pre-baseline history

Breaking and structural changes recorded while the contract was being defined, kept until the baseline is declared:

- [refactor] Restructure `modules` into an internal `core` (`createStore`, `createProvider`), content-driven `capabilities` (config, lang, light-dark) and `behaviors` (api, navigator, toast).
- [refactor] Remove `BaseModule` and `createModuleProvider` from the public API.
- [refactor] Curate the public type surface into first-class contracts (`Storage`, `IconAnimationConfig`, `IconProps`) and remove the internal blanket namespace re-exports.
- [refactor] Move `AnimadoView` (and its `AnimadoTypes`) to the application layer.
- [test] Reorganize the test suite to mirror the `src` tree (`core`/`capabilities`/`behaviors`/`components`).
- [add] Add `createCollectionProvider` capability: a content-driven, persisted, typed collection (add/update/remove) built on `createStore`/`createProvider` and the `Storage` adapter (validated in the base-template reference app: items and alarms are now consumers).
- [add] Extend the `Storage` contract with an optional `remove` (additive; existing adapters remain valid).