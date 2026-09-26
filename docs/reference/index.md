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
* **`useStagger` & `calculateStaggerDelay`**: Headless stagger timing coordination with automatic reduced-motion accessibility.
* **`useCollapsible`**: Headless disclosure and accordion height interpolation with off-screen measurement probe and reduced motion support.
* **`useIconAnimation`**: SVG stroke draw/reset animation driver.

### 5. [Components & Icons](components.md)
Base UI primitives and icon contracts:
* **`Button`**: Accessible interaction primitive with `{ pressed, disabled, loading }`.
* **`Slider` & `useSlider`**: Accessible continuous and discrete numeric track/thumb primitive (`role="adjustable"`).
* **`SegmentedControl` & `useSelect`**: Option selection primitive with radio group accessibility (`role="radiogroup"`).
* **`Stepper` & `useStepper`**: Step-based numeric increment/decrement with clamping (`role="spinbutton"`).
* **`Input`**: Accessible text input with state styling (`focused`, `disabled`, `error`).
* **`TimePicker`**: 24-hour hour/minute wheel selector.
* **`AlambreIcons`**: Vector icon family (`Cross`, `Tick`, `Arrow`, `Sun`, `Moon`, catalog shapes) and primitives (`Circle`, `Line`, `Path`).

### 6. [Drag & Drop Subsystem](dnd.md)
Headless drag-and-drop primitives, 60fps gesture physics, spatial hit-testing, and 1D sortable containers:
* **`DndProvider` & `useDnd`**: Central spatial registry, bounds tracking, and drop event coordination.
* **`useDraggable` & `Draggable`**: Pan gesture worklet, velocity-based rotation tilt, scale pop, boundary clamping, and return physics.
* **`useDroppable` & `Droppable`**: Spatial drop target registration, window coordinate measurement, and hover collision detection.
* **`SortableRow`**: 1D horizontal sorting container with customizable neighbor shift curves (`glide`, `linear`, `damped`, `bounce`), drop settle modes (`seamless`, `bounce`, `impact`), and native screen reader actions (`moveLeft` / `moveRight`).

