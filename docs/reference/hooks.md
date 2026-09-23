---
title: Hooks & State Utilities Reference
summary: Headless hooks and state helpers: useHistoryState, useStopwatch, and useIconAnimation.
---

# Hooks & State Utilities Reference

Headless hooks and state management primitives that solve common interaction patterns without enforcing visual presentation.

---

## 1. `useHistoryState`

Manages an undo/redo state history stack (`past`, `present`, `future`). Ideal for interactive boards, puzzles, canvas editors, or multi-step forms.

### Signature
```typescript
import { useHistoryState, type UseHistoryStateOptions } from 'alambre';

const {
  state,
  set,
  undo,
  redo,
  reset,
  canUndo,
  canRedo,
  history,
} = useHistoryState<T>(initialState: T, options?: UseHistoryStateOptions);
```

### Options
* `maxLimit?: number`: Maximum number of past states preserved (prevents memory leaks for long sessions).

### Properties & Actions
* `state: T`: The current active state (`present`).
* `set(next: T | ((current: T) => T))`: Updates state, pushes the old state to `past`, and clears `future`.
* `undo()`: Reverts to the previous state from `past` and places current state in `future`.
* `redo()`: Re-applies the next state from `future`.
* `reset(initial: T)`: Clears past and future, resetting present to `initial`.
* `canUndo: boolean`: True if there are past states available to undo.
* `canRedo: boolean`: True if there are future states available to redo.
* `history: HistoryState<T>`: Raw history object `{ past, present, future, maxLimit }`.

### Example
```typescript
import { useHistoryState } from 'alambre';

function DrawingBoard() {
  const { state: lines, set, undo, redo, canUndo, canRedo } = useHistoryState<Line[]>([], {
    maxLimit: 50,
  });

  const addLine = (newLine: Line) => {
    set((prev) => [...prev, newLine]);
  };

  return (
    <View>
      <Button onPress={undo} disabled={!canUndo} title="Undo" />
      <Button onPress={redo} disabled={!canRedo} title="Redo" />
    </View>
  );
}
```

### Pure History Helpers
The underlying functions are also exported for use outside of React (e.g. in tests, pure models, or custom reducers):
* `createHistory<T>(initial: T, maxLimit?: number): HistoryState<T>`
* `pushHistory<T>(history: HistoryState<T>, nextPresent: T): HistoryState<T>`
* `undoHistory<T>(history: HistoryState<T>): HistoryState<T>`
* `redoHistory<T>(history: HistoryState<T>): HistoryState<T>`
* `canUndo<T>(history: HistoryState<T>): boolean`
* `canRedo<T>(history: HistoryState<T>): boolean`

---

## 2. `useStopwatch`

Headless hook for tracking elapsed time, stopwatch intervals, and formatted duration display.

### Signature
```typescript
import { useStopwatch, type UseStopwatchOptions } from 'alambre';

const {
  seconds,
  isRunning,
  start,
  pause,
  reset,
  formattedTime,
} = useStopwatch(options?: UseStopwatchOptions);
```

### Options
* `autoStart?: boolean`: Whether the stopwatch starts immediately on mount (default: `false`).
* `initialSeconds?: number`: Starting second count (default: `0`).
* `intervalMs?: number`: Tick frequency in milliseconds (default: `1000`).

### Properties & Actions
* `seconds: number`: Total elapsed seconds.
* `isRunning: boolean`: True if the timer is currently active.
* `start()`: Resumes or starts counting.
* `pause()`: Pauses the timer without clearing elapsed seconds.
* `reset(newSeconds?: number)`: Resets timer to `newSeconds` or `initialSeconds`.
* `formattedTime: string`: Automatically formatted string (`"mm:ss"` or `"hh:mm:ss"` if $\ge 1$ hour).

### Helper: `formatStopwatchTime`
Standalone helper to format raw seconds into a human-readable string:
```typescript
import { formatStopwatchTime } from 'alambre';

formatStopwatchTime(75);   // "01:15"
formatStopwatchTime(3665); // "01:01:05"
```

---

## 3. `useIconAnimation`

Low-level driver hook for animated vector SVG primitives (`Line`, `Circle`, `Path`). Connects `drawIt` prop toggles with `strokeDashoffset` Reanimated animations.

---

## 4. `useStagger` & `calculateStaggerDelay`

Headless hook and utility for calculating staggered entrance delays across sequential elements (menu items, list rows, form sections). Decoupled from visual styles and layout, with built-in accessibility for reduced motion.

### Signature
```typescript
import { useStagger, type StaggerOptions } from 'alambre';

const { getDelay, isReducedMotion } = useStagger(options?: StaggerOptions);
```

### Options (`StaggerOptions`)
* `initialDelay?: number`: Delay before the first item starts animating (default: `60ms`).
* `staggerMs?: number`: Interval delay added per consecutive index (default: `50ms`).
* `maxDelay?: number`: Maximum delay ceiling to prevent long lists from stalling (default: `500ms`).

### Properties
* `getDelay(index: number): number`: Computes the delay in milliseconds for item at `index`. Returns `0` if reduced motion is enabled.
* `isReducedMotion: boolean`: True if the user prefers reduced motion (derived from `useReducedMotion()` in Reanimated).

### Pure Helper: `calculateStaggerDelay`
For calculations outside React component renders or in worklets:
```typescript
import { calculateStaggerDelay } from 'alambre';

calculateStaggerDelay(index, { initialDelay: 50, staggerMs: 40, maxDelay: 400 }, isReducedMotion);
```

### Context Propagation: `StaggerProvider` & `useStaggerItem`
Optional Context Provider to distribute stagger timing down a deep tree without prop drilling:
```typescript
import { StaggerProvider, useStaggerItem } from 'alambre';

function List() {
  return (
    <StaggerProvider initialDelay={100} staggerMs={40}>
      <ListItem index={0} />
      <ListItem index={1} />
    </StaggerProvider>
  );
}

function ListItem({ index }: { index: number }) {
  const delay = useStaggerItem(index);
  return (
    <Animated.View entering={FadeInDown.duration(300).delay(delay)}>
      {/* ... */}
    </Animated.View>
  );
}
```
