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

Low-level driver hook for animating SVG stroke drawing and fill opacity on vector primitives (`Line`, `Circle`, `Path`). Connects boolean toggles or progress percentages with Reanimated `strokeDashoffset` animations.

### Signature
```typescript
import { useIconAnimation, type IconAnimationConfig } from 'alambre';

const {
  strokeOffsetStyle,
  draw,
  reset,
} = useIconAnimation(config: IconAnimationConfig);
```

### Options (`IconAnimationConfig`)
* `strokeDasharray?: number`: Total stroke length of the path or circumference (default: `100`).
* `fillOpacity?: number`: Maximum fill opacity applied once stroke drawing completes.
* `drawAnimation?: (targetValue: number) => number`: Animation driver when drawing (default: `withTiming(v, { duration: 300 })`).
* `resetAnimation?: (targetValue: number) => number`: Animation driver when resetting (default: `withTiming(v, { duration: 300 })`).

### Properties & Actions
* `strokeOffsetStyle`: Reanimated `animatedProps` object containing reactive `strokeDasharray`, `strokeDashoffset`, and `fillOpacity` for animated SVG elements.
* `draw(percentOffset: number): void`: Triggers the draw animation. Pass `0` to draw 100% of the stroke, or a percentage offset (`0..100`).
* `reset(): void`: Triggers the reverse animation, hiding the stroke and resetting fill opacity to `0`.

### Example: Custom Animated Vector Icon
```typescript
import { useEffect } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import { useIconAnimation } from 'alambre';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function AnimatedCheckmark({ drawIt, color = '#10b981', size = 32 }: { drawIt: boolean; color?: string; size?: number }) {
  const pathLength = 60; // Approximate total length of the checkmark stroke
  const { strokeOffsetStyle, draw, reset } = useIconAnimation({
    strokeDasharray: pathLength,
  });

  useEffect(() => {
    if (drawIt) {
      draw(0);
    } else {
      reset();
    }
  }, [drawIt, draw, reset]);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <AnimatedPath
        d="M4 12l5 5L20 6"
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        animatedProps={strokeOffsetStyle}
      />
    </Svg>
  );
}
```


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

---

## 6. `useWavefront` (alias: `useKineticOrchestrator`)

Headless single-clock kinetic wavefront orchestrator for coordinated staggered animations on the UI thread. Instead of spawning $N$ concurrent numerical ODE spring solvers with `withSpring()`, `useWavefront` drives a single master progress clock ($\tau \in [0, 1]$) and partitions phase analytically to compute individual item progress in $O(1)$ worklet math.

### Signature
```typescript
import {
  useWavefront,
  type UseWavefrontOptions,
  type UseWavefrontReturn,
  type WavefrontCurve,
} from 'alambre';

const {
  progress,
  getItemProgress,
  getItemPhase,
  start,
  reset,
  totalDuration,
} = useWavefront(options: UseWavefrontOptions);
```

### Options (`UseWavefrontOptions`)
* `count: number`: Total number of items in the staggered collection.
* `staggerMs?: number`: Delay in milliseconds between consecutive items starting (default: `35ms`).
* `itemDuration?: number`: Duration in milliseconds for each item's transition (default: `260ms`).
* `curve?: WavefrontCurve | ((phase: number) => number)`: Analytical transfer function curve. Built-in curves: `'criticallyDamped'`, `'bouncy'`, `'overshoot'`, `'cubicEaseOut'` (default: `'criticallyDamped'`). Custom worklet functions are also accepted.
* `autoStart?: boolean`: Whether to start the wavefront immediately on mount (default: `true`).
* `driver?: 'timing' | 'spring'`: Progress driver mode. Timing uses `withTiming(1, { duration, easing: Easing.linear })`; spring uses `withSpring(1, kinetics.spring.responsive)` (default: `'timing'`).

### Properties & Actions (`UseWavefrontReturn`)
* `progress: SharedValue<number>`: Master normalized progress clock ($\tau \in [0, 1]$).
* `getItemProgress(index: number): number`: Worklet function to evaluate the curve-transformed progress ($[0, 1]$) for item at `index`. Run directly inside `useAnimatedStyle`.
* `getItemPhase(index: number): number`: Worklet function to evaluate the raw normalized phase ($\phi \in [0, 1]$) without curve application.
* `start(): void`: Starts or restarts the wavefront animation.
* `reset(): void`: Resets master progress back to `0`.
* `totalDuration: number`: Total elapsed time in milliseconds from wave start to the final item completing.

### Context Propagation: `WavefrontProvider` & `useWavefrontItem` (The 3-Line Rule)

To eliminate worklet boilerplate for consumer components and AI agents writing app screens, use `WavefrontProvider` and `useWavefrontItem`:

```typescript
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { WavefrontProvider, useWavefrontItem } from 'alambre';

export function StaggeredList({ items }: { items: string[] }) {
  return (
    <WavefrontProvider count={items.length} staggerMs={35} itemDuration={250}>
      <View>
        {items.map((item, index) => (
          <StaggeredCard key={item} item={item} index={index} />
        ))}
      </View>
    </WavefrontProvider>
  );
}

function StaggeredCard({ item, index }: { item: string; index: number }) {
  // 3-Line Rule: 1 line hook, 1 line element, 0 worklet boilerplate
  const { animatedStyle } = useWavefrontItem(index, { preset: 'slide-up' });

  return (
    <Animated.View style={animatedStyle}>
      {/* Presentation item */}
    </Animated.View>
  );
}
```

#### Presets (`WavefrontPreset`)
* `'slide-up'`: translates upward from `distance` with opacity 0 to 1 (default).
* `'slide-scale'`: translates upward with subtle scale (0.96 to 1) and opacity.
* `'slide-down'`: translates downward from `-distance` with opacity.
* `'fade'`: opacity 0 to 1.
* `'scale'`: subtle scale 0.9 to 1 with opacity.
* `'pop'`: tactile scale pop 0.8 to 1 with opacity (ideal with bouncy/overshoot curves).

Custom style worklets are also supported:
```typescript
const { animatedStyle } = useWavefrontItem(index, {
  style: (p, phase) => {
    'worklet';
    return { opacity: p, transform: [{ rotateZ: `${(1 - p) * 20}deg` }] };
  },
});
```

---

## 7. `usePressKinetics`

Universal headless tactile interaction hook. Provides instant 60/120 FPS UI-thread micro-touch feedback (spring scale, depress translation, clamped opacity) with asymmetric physics (immediate responsive press-in, bouncy tactile release) and zero JS thread re-render overhead.

### Signature
```typescript
import { usePressKinetics, type UsePressKineticsOptions } from 'alambre';

const { pressProps, animatedStyle, progress, isPressed, pressed } = usePressKinetics(options?: UsePressKineticsOptions);
```

### Options (`UsePressKineticsOptions`)
* `activeScale?: number`: Scale factor applied when pressed down (default: `0.96`).
* `activeOpacity?: number`: Opacity factor applied when pressed down (default: `1`).
* `activeTranslateY?: number`: Translation Y in points when pressed down for 3D depress effect (default: `0`).
* `springConfig?: WithSpringConfig`: General fallback spring configuration.
* `pressInSpringConfig?: WithSpringConfig`: Spring configuration on press down (default: `kinetics.spring.responsive`).
* `pressOutSpringConfig?: WithSpringConfig`: Spring configuration on press release (default: `kinetics.spring.bouncy`).
* `disabled?: boolean`: Whether interaction is disabled (default: `false`).
* `forceReducedMotion?: boolean`: Snaps scale/opacity instantly without spring delay (default: `false`).
* `trackState?: boolean`: Synchronizes React boolean `pressed` state. Default `false` to avoid JS thread re-renders.
* `hapticFeedback?: () => void`: Optional callback fired on press down for tactile haptics.
* `onPress?: (event: GestureResponderEvent) => void`: Optional callback on press release.
* `onLongPress?: (event: GestureResponderEvent) => void`: Optional callback on long press.
* `onPressIn?: (event: GestureResponderEvent) => void`: Optional callback when press begins.
* `onPressOut?: (event: GestureResponderEvent) => void`: Optional callback when press ends.

### Properties (`UsePressKineticsReturn`)
* `pressProps`: Spreadable handlers for `<Pressable {...pressProps}>`.
* `animatedStyle`: Animated style object to apply to `<Animated.View style={animatedStyle}>` or `<AnimatedPressable style={animatedStyle}>`.
* `progress`: Reanimated `SharedValue<number>` representing animated press progress (0 = idle, 1 = pressed).
* `isPressed`: Alias for `progress`.
* `pressed`: Synchronous JS boolean representing active press state (only updated if `trackState: true`).

### Example (The 3-Line Rule)
```typescript
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressKinetics } from 'alambre';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function InteractiveCard({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  const { pressProps, animatedStyle } = usePressKinetics({
    activeScale: 0.97,
    activeTranslateY: 2,
    onPress,
  });

  return (
    <AnimatedPressable {...pressProps} style={[styles.card, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
```



