---
title: Alambre Functional Reference
summary: Catalog of the complete functional reference and API guides for alambre capabilities, behaviors, hooks, storage utilities, and components.
---

# Alambre — Functional Reference

This directory provides the complete functional reference and API guides for all capabilities, behaviors, hooks, storage utilities, and components provided by `alambre`.

For global principles and boundaries, see [docs/architecture.md](../architecture.md), [docs/project.md](../project.md), and [docs/agents.md](../agents.md).

For the retrieval protocol all agents must follow when consulting this documentation, see `.agents/skills/docs-retrieval/SKILL.md`.

---

## Navigation & Reference Sections

### 1. [Capabilities](capabilities.md)
State and capability providers backed by the storage contract:
* **`createConfigProvider`**: Flat key-value configuration and preferences.
* **`createLangProvider`**: Multi-language localization (i18n) management.
* **`createLightDarkProvider`**: Light / Dark theme tokens and switching.
* **`createCollectionProvider`**: Persisted, typed collections with CRUD actions (`records`, `loading`, `add`, `update`, `remove`).

### 2. [Behaviors](behaviors.md)
Application behavioral patterns decoupled from presentation:
* **`NavigatorProvider` & `useNavigator`**: Page and subpage routing with history stack and scroll offset tracking.
* **`ToastProvider` & `useToast`**: Non-blocking, transient feedback notifications.
* **`ConfirmProvider` & `useConfirm`**: Blocking confirmation dialogs with Promise-based responses.
* **`createApiProvider`**: TanStack React Query integration wrapper.

### 3. [Storage Layer](storage.md)
Persistence abstraction and serialization helpers:
* **`createStorage`**: Adapts raw key-value bindings (e.g. `AsyncStorage`) to the `Storage` contract.
* **JSON Helpers**: `getJson`, `setJson`, `removeJson`.
* **Collection Helpers**: `readCollection`, `writeCollection`.

### 4. [Hooks & State Utilities](hooks.md)
Headless interaction hooks and pure helpers:
* **`useHistoryState`**: Undo / Redo stack management with optional limits.
* **History Helpers**: `createHistory`, `pushHistory`, `undoHistory`, `redoHistory`, `canUndo`, `canRedo`.
* **`useStopwatch`**: Elapsed time tracking, pause, reset, and formatted string display.
* **`useIconAnimation`**: SVG stroke draw/reset animation driver.

### 5. [Components & Icons](components.md)
Base UI primitives and icon contracts:
* **`Button`**: Accessible interaction primitive with `{ pressed, disabled, loading }`.
* **`TimePicker`**: 24-hour hour/minute wheel selector.
* **`AlambreIcons`**: Vector icon family (`Cross`, `Tick`, `Arrow`, `Sun`, `Moon`, catalog shapes) and primitives (`Circle`, `Line`, `Path`).
