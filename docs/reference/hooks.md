---
title: Hooks & State Utilities Reference
summary: Headless hooks and state helpers: useHistoryState, useStopwatch, useIconAnimation, useStagger, and useCollapsible.
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

---

## 5. `useCollapsible`

Headless hook for expandable and collapsible content (accordions, disclosure sections, expandable cards). Solves the React Native limitation where `height: 'auto'` cannot be animated via Reanimated shared values, using an off-screen layout measurement probe and spring/timing interpolation with automatic reduced motion support.

### Signature
```typescript
import {
  useCollapsible,
  type UseCollapsibleOptions,
  type UseCollapsibleReturn,
} from 'alambre';

const {
  isExpanded,
  toggle,
  setExpanded,
  measuredHeight,
  handleContentLayout,
  progress,
  animatedStyle,
  probeProps,
} = useCollapsible(options?: UseCollapsibleOptions);
```

### Options (`UseCollapsibleOptions`)
* `expanded?: boolean`: Controlled boolean expansion state.
* `defaultExpanded?: boolean`: Initial state when uncontrolled (default: `false`).
* `onToggle?: (expanded: boolean) => void`: Callback fired when expansion state toggles.
* `transitionType?: 'spring' | 'timing'`: Animation curve (default: `'spring'`).
* `springConfig?: { damping?: number; stiffness?: number; mass?: number }`: Spring physics parameters when `transitionType === 'spring'` (default: `damping: 20, stiffness: 240, mass: 0.8`).
* `duration?: number`: Duration in milliseconds when `transitionType === 'timing'` (default: `240`).

### Properties & Actions (`UseCollapsibleReturn`)
* `isExpanded: boolean`: Current boolean expanded state.
* `toggle(): void`: Inverts current expansion state.
* `setExpanded(next: boolean): void`: Sets expansion state explicitly.
* `measuredHeight: number`: Inner content height in pixels measured via `handleContentLayout`.
* `handleContentLayout(event: LayoutChangeEvent): void`: Layout handler to attach to the inner content container.
* `progress: SharedValue<number>`: Reanimated shared value between `0` (closed) and `1` (open).
* `animatedStyle: { height: number | undefined; overflow: 'hidden' }`: Animated styles to apply to the visible container.
* `probeProps`: Helper props (`pointerEvents="none"`, off-screen styling, and `onLayout`) to spread onto a measurement probe element.

### Example
```typescript
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useCollapsible } from 'alambre';

export function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { isExpanded, toggle, animatedStyle, probeProps, handleContentLayout } = useCollapsible({
    transitionType: 'spring',
  });

  return (
    <View style={styles.card}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        style={styles.header}
      >
        <Text style={styles.title}>{title}</Text>
      </Pressable>

      {/* Visible animated collapsible container */}
      <Animated.View style={animatedStyle}>
        <View onLayout={handleContentLayout} style={styles.content}>
          {children}
        </View>
      </Animated.View>

      {/* Off-screen measurement probe to handle dynamic content height */}
      <View {...probeProps} style={[probeProps.style, styles.content]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, backgroundColor: '#ffffff', overflow: 'hidden' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '600' },
  content: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#e2e8f0' },
});
```

