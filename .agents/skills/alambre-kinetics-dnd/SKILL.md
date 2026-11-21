---
name: alambre-kinetics-dnd
description: Physics-driven animations, gestures, drag-and-drop, spatial flights, carousels, decks, and animated SVG icons in alambre. Use when implementing Reanimated press kinetics (usePressKinetics, kinetics), staggered/wavefront entrances (useStagger, useWavefront), collapsible views (useCollapsible), swipeable rows/cards (useSwipeableRow, useKineticSwipe, useDeck), drag-and-drop (DndProvider, Draggable, Droppable, SortableRow), spatial flights (SpatialSpace, useFlightTrajectory, useCascadeFlight), or stroke-drawn icons (AlambreIcons).
---

# `alambre` Kinetics, Gestures, Drag-and-Drop & Icons

`alambre` provides UI-thread Reanimated hooks, physics presets, drag-and-drop primitives, and animated SVG icons.

---

## 1. `kinetics` Presets & Reanimated Guardrail

Import standardized spring, timing, and analytical curve tokens from `alambre` instead of inventing arbitrary spring numbers:

```tsx
import { kinetics } from 'alambre';
import { withSpring, withTiming } from 'react-native-reanimated';

// Physical & Apple-style duration-bounded springs:
withSpring(target, kinetics.spring.snappy);     // { damping: 20, mass: 1, stiffness: 250 }
withSpring(target, kinetics.spring.bouncy);     // { damping: 14, mass: 1, stiffness: 150 }
withSpring(target, kinetics.spring.gentle);     // { damping: 25, mass: 1, stiffness: 100 }
withSpring(target, kinetics.spring.stiff);      // { damping: 20, mass: 1, stiffness: 300 }
withSpring(target, kinetics.spring.settled);    // { duration: 350, dampingRatio: 1, overshootClamping: true }
withSpring(target, kinetics.spring.snap);       // { duration: 300, dampingRatio: 0.85 }
withSpring(target, kinetics.spring.sheet);      // { duration: 300, dampingRatio: 0.82, overshootClamping: true }
withSpring(target, kinetics.spring.responsive); // { duration: 220, dampingRatio: 0.95, overshootClamping: true }
withSpring(target, kinetics.spring.budgeted);   // frame-budgeted rest thresholds

// Timing presets:
withTiming(target, kinetics.timing.fast);  // 150ms
withTiming(target, kinetics.timing.base);  // 250ms
withTiming(target, kinetics.timing.slow);  // 350ms
withTiming(target, kinetics.timing.sheet); // 300ms
```

**CRITICAL REANIMATED GUARDRAILS:**
1. **Never pass `withSpring(...)` or `withTiming(...)` directly inside `interpolate(...)`** — they return animation descriptors, not numbers, resulting in `NaN` and invisible UI. Either assign them to a style property directly or derive a shared value first:
```tsx
const progress = useDerivedValue(() => withSpring(active ? 1 : 0, kinetics.spring.snappy));
const style = useAnimatedStyle(() => ({
  opacity: interpolate(progress.value, [0, 1], [0.4, 1]),
}));
```

2. **NEVER read `SharedValue.value` during component render (JSX)**:
Reanimated `SharedValue` instances reside on the C++/UI-thread. Accessing `sharedValue.value` directly in the render function body or inside JSX inline style/props causes `WARN [Reanimated] Reading from value during component render`, silent desynchronization, and thread tearing.
- **Always read `.value` inside a worklet**: use `useAnimatedStyle(() => { 'worklet'; return { ... }; })` or `useDerivedValue(() => { 'worklet'; return ...; })`.
- **Apply the style to an `Animated.*` component**: e.g., `<Animated.View style={animatedStyle}>` or `<Animated.Text style={animatedTextStyle}>`.
- **Never evaluate `.value` inline in JSX**:
```tsx
// ❌ FORBIDDEN: Reads .value during React component render
<Text style={{ color: colorProgress.value > 0.5 ? 'white' : 'black' }} />

// ✅ CORRECT: Encapsulated in a worklet applied to Animated.* component
const animatedTextStyle = useAnimatedStyle(() => ({
  color: interpolateColor(colorProgress.value, [0, 1], [theme.color, '#ffffff']),
}));
<Animated.Text style={animatedTextStyle} />
```

---

## 2. Tactile Interaction Hooks

### Press Feedback (`usePressKinetics`)
```tsx
import { usePressKinetics } from 'alambre';

const { animatedStyle, onPressIn, onPressOut } = usePressKinetics({
  scaleTo: 0.96,
});
```

### Collapsible Containers (`useCollapsible`)
```tsx
import { useCollapsible } from 'alambre';

const { animatedStyle, onContentLayout, isExpanded, toggle } = useCollapsible({
  expanded: open,
  transition: 'spring',
});
```

### Staggered & Wavefront Lists (`useStagger`, `useWavefront`)
- Single-clock traveling wavefront across $N$ items on the UI thread:
```tsx
import { WavefrontProvider, useWavefrontItem } from 'alambre';

<WavefrontProvider itemCount={items.length} staggerMs={40} preset="spring">
  {items.map((item, index) => (
    <RowItem key={item.id} index={index} />
  ))}
</WavefrontProvider>
```

### Swipeable Rows, Carousels & Card Decks
- `useSwipeableRow({ threshold, onSwipeLeft, onSwipeRight })`: Action-revealing or dismissible list rows.
- `useCarousel({ itemCount, itemWidth, gap })` / `useKineticCarousel`: Snap-interval horizontal carousels with 3D/scale transforms.
- `useDeck({ count, onSwipe })` / `useKineticSwipe`: Stack of swipeable cards with tilt and velocity projection.

---

## 3. Drag-and-Drop (`DndProvider`, `Draggable`, `Droppable`, `SortableRow`)

Wrap the interactive surface in `<DndProvider>`:

```tsx
import { DndProvider, Draggable, Droppable, SortableRow } from 'alambre';

<DndProvider onDrop={(event) => handleDrop(event.draggableId, event.droppableId)}>
  <Draggable id="card-1" data={{ value: 10 }}>
    {({ isDragging }) => <CardView active={isDragging} />}
  </Draggable>

  <Droppable id="zone-a">
    {({ isOver }) => <DropTarget highlighted={isOver} />}
  </Droppable>
</DndProvider>

// Horizontal/vertical reorderable list:
<SortableRow
  items={items} // Array of { id: string, ... }
  onReorder={setItems}
  renderItem={(item, { isDragging }) => <ChipView item={item} active={isDragging} />}
/>
```

---

## 4. Spatial Coordinates, Flights & Cross-Container Handoffs

Coordinate cross-container animations (e.g., dealing items from a source pile to target slots, discarding, drawing):
- `useCardTable({ initialCards, totalCapacity, ... })` + `<CardTable table={table} renderCard={...} />`: **Turnkey Card Table Manager**. Encapsulates single-identity persistent cards, 3D parabolic flights, magnetic equilibrium fan slots, zero-unmount deck/hand/discard zone management, and bulletproof Android-safe 3D flipping (WITHOUT `backfaceVisibility: 'hidden'` culling bugs).
- `useDeckSwipe3D({ initialCards, ... })`: **Turnkey 3D Kinetic Deck**. Full perspective projection (`perspective: 1000`, `rotateX`, `rotateY`, `rotateZ`, specular sheen), dynamic underneath stack elevation (`scale: 0.93 -> 1.0`), and deterministic non-blocking dismissals (~180ms timing with fallback guard).
- `<SpatialSpace>` + `<SpatialFlightLayer />`: Hoists all flying elements to the root canvas, completely eliminating Android HWUI `borderRadius` / overflow clipping.
- `useSpatialTarget(id)`: Registers named coordinate anchors and computes live 2D vectors between them (`useSpatialVector(fromId, toId)`).
- `useFlightTrajectory({ from, to, trajectory: 'parabolic' | 'arc' | 'linear' })`: Animates an element along a 2D curve with altitude scaling.
- `useCascadeFlight` / `useDealCascade`: Multi-item staggered flight choreography with locked-capacity fan stability.
- `useInteractiveHand`: Fanned card/tile hand with synchronous external sort reconciliation, locked total capacity, and toss physics.

---

## 5. Strict Physical Contracts & Anti-Jerk Invariants

Every agent authoring kinetic, gesture, or spatial animation code MUST obey these 5 physical invariants:

### Invariant 1: Anchor Alignment (Center vs. Top-Left)
- **Convention:** In 2D space, trajectories compute paths between **centers** (`centerCoord`, `targetCenter`).
- **Placement Rule:** If an element of size `(W, H)` is positioned absolutely via `translateX/translateY` along a center-based trajectory `pt`, it MUST be centered explicitly by offsetting half its width and height:
  ```tsx
  // ✅ CORRECT: Aligns element center with trajectory coordinate
  transform: [
    { translateX: pt.x - ITEM_WIDTH / 2 },
    { translateY: pt.y - ITEM_HEIGHT / 2 },
  ]
  ```
- **Slot Consistency:** Hand slots and receiving docks must use the identical anchor offset. Never place a slot with top-left anchoring while flying to its center coordinate.

### Invariant 2: The Magnetic Anchor Principle (Single-Identity Continuous Entities)
- **The Core Axiom:** A hand of cards, a dock, or an inventory slot is physically and mathematically a **system of magnetic anchor points** $(x_i, y_i, \theta_i, z_i)$.
- **Single Persistent Identity:** Physical game items (cards, tokens, pucks) MUST remain continuously mounted across their entire lifecycle (in deck, in flight, in hand, in discard).
- **Prohibition of "Dual-World" Cloning:** NEVER bifurcate animations by creating a temporary "Flight Clone View" that animates across the screen and then unmounts while a "Slot View" mounts in a separate container via an asynchronous JS callback (`runOnJS`). That bridge latency causes subpixel jumps, frame drops, and landing glitches.
- **Magnetic Equilibrium Shift:**
  1. For Deal/Draw: The card's target anchor shifts from deck $(x_{deck}, y_{deck})$ to slot $(x_{slot}, y_{slot}, \theta_{slot})$. It glides smoothly with a Reanimated spring or parabolic trajectory worklet. When it arrives, it is ALREADY the item in the hand.
  2. For Re-fan/Sort: Existing hand items simply receive their updated slot coordinates and spring smoothly sideways to their new magnetic equilibrium.
  3. For Discard: The card's target anchor shifts to $(x_{discard}, y_{discard})$. It arches into the discard pile, while remaining hand cards automatically glide closer to fill the vacancy.

### Invariant 3: Visual Handoff & Staging (When using Overlays)
- **Zero-Frame Unmount Prohibited:** If an overlay flight MUST be used (e.g. cross-modal hero morphs), NEVER delete an item from its origin state (`setItems(prev => prev.filter(...))`) simultaneously with launching a flight. The item will vanish instantly at $t=0$, causing a teleport effect.
- **Optimistic Staging Protocol:**
  1. For Discard/Toss: Mark the item as `stagedForDiscardId` (or let the flight overlay render over it) and hide the origin slot, or delay filtering until `onComplete`.
  2. For Deal/Draw: Keep the receiving slot stationary. Pre-allocate the hand slot with `totalCapacity` so existing cards do NOT jump horizontally when new cards land.
  3. Destination Handoff: The receiving view must mount at the EXACT pixel and rotation where the flight landed. Never trigger a secondary `withSpring` from `0` or undefined on mount.

### Invariant 3: Strict Ban on Dimension Feedback Loops in `onLayout`
- **Never mutate container size state from `onLayout`:**
  ```tsx
  // ❌ FORBIDDEN: Infinite shrinking/expanding loop when container has borders/padding!
  const [height, setHeight] = useState(300);
  <View style={{ height }} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
  ```
- **Rule:** Containers must have fixed heights or use natural flex layout. `onLayout` may only record dimensions for clamping/bounds (e.g. `arenaWidthRef.current`), never to re-feed into the measured container's own style.

### Invariant 4: Clean Physical Tokens (No Semantic Button Nesting)
- Physical game tokens (cards, chips, pucks, tiles) must NEVER be wrapped in semantic design-system components like `AppButton`.
- `AppButton` adds opinionated theme borders (`1.5px`), minimum touch targets (`44px`), and padding, creating ugly double-borders and misaligned hitboxes.
- Use clean, unstyled primitives: `<Pressable style={styles.cardHitbox}>` or `<Animated.View>` with explicit dimensions.

### Invariant 5: Gesture Coordinate Systems (`Gesture.Pan`)
- In `react-native-gesture-handler`, `e.x` and `e.y` in child views are **relative to the touched child view's top-left corner (0..width, 0..height)**.
- **Never assign `posX.value = e.x`** in `onUpdate`.
- **Always track position using start offset + delta**:
  ```tsx
  .onStart(() => {
    'worklet';
    startPosX.value = posX.value;
    startPosY.value = posY.value;
  })
  .onUpdate((e) => {
    'worklet';
    posX.value = startPosX.value + e.translationX;
    posY.value = startPosY.value + e.translationY;
  })
  ```

---

## 6. Animated Stroke Icons (`AlambreIcons`)

All `AlambreIcons` support animated SVG stroke drawing via `drawIt`:

```tsx
import { AlambreIcons } from 'alambre';

<AlambreIcons.Arrow
  drawIt={true}
  color={theme.primary}
  lineWidth={16}
  rotation={180} // optional degrees
  style={{ width: 20, height: 14 }}
/>
```
Available icons include: `Arrow`, `Sun`, `Moon`, `Coffee`, `Documents`, `Refresh`, `Check`, `Close`, `Plus`, `Minus`, `Search`, `SettingsIcon`, `HomeIcon`, and custom icon creation via `createAnimatedIcon` / `MorphIcon`.
