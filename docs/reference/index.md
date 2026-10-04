---
title: Alambre Functional Reference
summary: Catalog of the complete functional reference and API guides for alambre capabilities, behaviors, hooks, storage utilities, and components.
---

# Alambre — Functional Reference

This directory provides the complete functional reference and API guides for all capabilities, behaviors, hooks, storage utilities, and components provided by `alambre`.

For global principles and boundaries, see [docs/framework/architecture.md](../framework/architecture.md). For the agent system, see [docs/guidelines/agents.md](../guidelines/agents.md).

For the retrieval protocol all agents must follow when consulting this documentation, see `.agents/skills/docs-retrieval/SKILL.md`.

---

## Navigation & Reference Sections

### 1. [Capabilities](capabilities.md)
State and capability external stores backed by the storage contract and synchronized via `useSyncExternalStore` (Zero React Context, returning `{ store, actions, use... }`):
* **`createConfig`**: Flat key-value configuration and preferences (`saveField`, `useConfig`).
* **`createLang`**: Multi-language localization (i18n) management (`changeLang`, `useLang`).
* **`createLightDark`**: Light / Dark theme tokens and switching (`toggleTheme`, `setThemeName`, `useLightDark`).
* **`createCollection`**: Persisted, typed collections with CRUD actions (`records`, `loading`, `add`, `update`, `remove`, `useCollection`).

### 2. [Behaviors](behaviors.md)
Application behavioral patterns, overlay hosts, and headless physics drivers:
* **`NavigatorProvider` & `useNavigator`**: Page and subpage routing with history stack and scroll offset tracking.
* **`ConfirmHost`, `confirm`, & `useConfirm`**: Blocking confirmation dialogs with Promise-based responses and direct imperative execution.
* **`ToastHost`, `toast`, & `useToast`**: Non-blocking transient feedback notifications with direct imperative triggers (`toast.show()`).
* **`createApi`**: TanStack React Query integration wrapper and typed query/mutation hook generators without internal context.
* **`useCarousel`**: Headless content carousel with Reanimated scroll worklets, snap calculations, and auto-play.
* **`useDeck`**: Headless swipeable card stack with angular rotation kinematics, history stack, and gesture controls.
* **`useWheelPicker`**: Headless kinetic wheel picker with momentum flick, spring settling, and multi-cycle virtual scrolling.
* **`useContinuousPress`**: Headless continuous press gesture with hold-to-repeat, delay threshold, and interval acceleration.

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
* **`AlambreIcons`**: Vector icon family (`Cross`, `Tick`, `Arrow`, `Sun`, `Moon`, catalog shapes) and primitives (`Circle`, `Line`, `Path`).

### 6. [Drag & Drop Subsystem](dnd.md)
Headless drag-and-drop primitives, 60fps gesture physics, spatial hit-testing, and 1D sortable containers:
* **`DndProvider` & `useDnd`**: Central spatial registry, bounds tracking, and drop event coordination.
* **`useDraggable` & `Draggable`**: Pan gesture worklet, velocity-based rotation tilt, scale pop, boundary clamping, and return physics.
* **`useDroppable` & `Droppable`**: Spatial drop target registration, window coordinate measurement, and hover collision detection.
* **`SortableRow`**: 1D horizontal sorting container with customizable neighbor shift curves (`glide`, `linear`, `damped`, `bounce`), drop settle modes (`seamless`, `bounce`, `impact`), and native screen reader actions (`moveLeft` / `moveRight`).

### 7. [Text Animations](text-animations.md)
Kinetic typography and animated text primitives powered by Reanimated worklets and `kinetics.ts` physics:
* **`CountUp`**: Tabular-nums digit-column rolling counter with cubic deceleration.
* **`Typewriter`**: Linear character-by-character progressive text reveal on the UI thread without re-renders.
* **`Scramble`**: Randomized glyph matrix decrypting reveal with quadratic ease-out.
* **`Marquee`**: Infinite looping horizontal content ticker with auto-measured clone wrap.
* **`WavyText`**: Continuous staggered vertical sine oscillation across characters.
* **`SlideInText`**: Physics-driven staggered card/glyph cascade powered by `kinetics.spring.bouncy`.

---

## 8. Canonical Root Hierarchy (Zero-Context Architecture)

In Alambre's Headless architecture, global capabilities (**Config, Lang, LightDark, Collection**) run on external stores (`useSyncExternalStore`) and require **zero context providers** in `App.tsx`. Components consume them directly without wrapping providers or unmount risks.

The application tree only mounts providers where true native hierarchy, safe-area insets, or structural spatial registration is physically required.

### The Canonical Tree

```
GestureHandlerRootView (native touch root)
└── SafeAreaProvider (safe area insets)
    └── NavigatorProvider (routing & navigation history - optional)
        └── DndProvider (spatial drag & drop registry - optional)
            └── ApiProvider (TanStack query cache - optional)
                ├── AppNavigatorBody / Screen Content
                ├── ConfirmHost (renders active confirm dialog)
                └── ToastHost (renders active toast notification)
```

### Hierarchy Rationale

| Level | Component | Rationale |
| --- | --- | --- |
| **1. Platform** | `GestureHandlerRootView`, `SafeAreaProvider` | Encloses all native gesture responders (pan, swipe, DnD) on Android/iOS and supplies window insets to child components. |
| **2. Routing (Optional)** | `NavigatorProvider` | Manages page routing, transition animations, and history stack when using Alambre's lightweight navigator. |
| **3. Gestures (Optional)** | `DndProvider` | Encloses screens utilizing drag-and-drop, providing a spatial coordinate registry for draggable cards and droppable zones. |
| **4. Data (Optional)** | `ApiProvider` | Injects TanStack React Query client for query caching and mutation hooks. |
| **5. Overlay Hosts** | `ConfirmHost`, `ToastHost` | Zero-context rendering slots mounted at root to display modal dialogs and HUD banners above all screens. |

### Canonical `App.tsx` Implementation

```tsx
// App.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigatorProvider,
  ConfirmHost,
  ToastHost,
  DndProvider,
} from 'alambre';

import { ApiProvider } from './services/api';
import { navigatorConfig } from './navigation/config';
import { AppNavigatorBody } from './navigation/AppNavigatorBody';
import ConfirmDialog from './components/ConfirmDialog';
import TemplateToast from './components/TemplateToast';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigatorProvider pages={navigatorConfig}>
          <DndProvider>
            <ApiProvider>
              <AppNavigatorBody />
              <ConfirmHost ConfirmComponent={ConfirmDialog} />
              <ToastHost ToastComponent={TemplateToast} />
            </ApiProvider>
          </DndProvider>
        </NavigatorProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```


