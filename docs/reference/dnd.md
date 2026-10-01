---
title: Drag & Drop Reference
summary: Headless drag-and-drop primitives, 60fps gesture physics, spatial hit-testing, and 1D sortable containers.
---

# Drag & Drop Reference

`alambre` provides a headless, presentation-neutral drag-and-drop subsystem built on `react-native-gesture-handler` and `react-native-reanimated`.

In accordance with [docs/architecture.md](../architecture.md) §2 and §6, the framework manages gesture worklets, velocity-driven kinetics, spatial hit-testing, and reordering state math. The consuming application provides visual styling, card geometry, colors, and layout wrappers.

---

## Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                      DndProvider                       │
│  (Manages central droppable registry & hit-testing)    │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌───────────────────┐               ┌─────────────────┐
│     Draggable     │               │    Droppable    │
│  (Pan gesture,    │ ─── Drag ───> │  (Bounds rect   │
│   velocity tilt,  │   Telemetry   │   hover hit-    │
│   physics settle) │               │   detection)    │
└───────────────────┘               └─────────────────┘
```

1. **Spatial Registry:** Every droppable zone registers its screen-relative window coordinates (`LayoutBounds = { x, y, width, height }`) inside the `DndProvider`.
2. **UI-Thread Pan Worklets:** Gesture tracking runs on the Reanimated UI thread at native frame rates (60/120fps). Translations, dynamic velocity tilt (`interpolate`), and pickup scale execute without crossing the JavaScript bridge.
3. **Collision Detection:** Active touch coordinates are streamed to the context, which evaluates rectangular overlap against registered droppable bounds to maintain `hoveredZoneId` and `isOver`.
4. **Drop Lifecycle:** Upon gesture release, if the item rests over an active droppable zone, `onDrop({ draggableId, draggableData, droppableId, droppableData })` is emitted. Otherwise, if `returnOnReject: true`, the item springs back to its origin coordinates.

---

## 1. `DndProvider` & `useDnd`

Central coordinate and registration provider that wraps the tree containing draggables and droppables.

### Signature & Props
```typescript
import { DndProvider, useDnd, type DropEvent } from 'alambre';

<DndProvider onDrop={(event: DropEvent) => handleDrop(event)}>
  <AppContent />
</DndProvider>
```

* `children: ReactNode`: The child tree.
* `onDrop?: (event: DropEvent) => void`: Callback fired when any draggable is released over a valid droppable.

### Hook Return (`DndContextValue`)
```typescript
const {
  activeDrag,
  hoveredZoneId,
  registerDroppable,
  updateDroppableBounds,
  measureAllDroppables,
  onDragStart,
  onDragMove,
  onDragEnd,
} = useDnd();
```

* `activeDrag: ActiveDragState | null`: Telemetry object containing `{ id, data, touchX, touchY, originBounds, hoveredZoneId }`.
* `hoveredZoneId: string | null`: The ID of the currently hovered droppable zone (or `null`).
* `measureAllDroppables()`: Imperatively measures all registered droppables in window coordinates (useful when parent containers scroll).

---

## 2. `useDraggable` & `Draggable`

Headless primitive and hook that adds continuous pan gesture tracking, scale transforms, velocity tilt, and boundary clamping to any element.

### Component Signature
```typescript
import { Draggable, type DraggableKineticsConfig } from 'alambre';

<Draggable
  id="card-1"
  data={{ name: 'Axe', power: 45 }}
  kinetics={{
    activeScale: 1.08,
    maxVelocityTiltDeg: 12,
    springDamping: 20,
    springStiffness: 240,
    returnOnReject: true,
  }}
  onDragStart={() => console.log('Started dragging')}
  onDragEnd={(droppableId) => console.log('Dropped on', droppableId)}
>
  {({ isDragging }) => (
    <View style={[styles.card, isDragging && styles.cardActive]}>
      <Text>Axe</Text>
    </View>
  )}
</Draggable>
```

### Props (`DraggableProps<T>`)
* `id: string`: Unique identifier.
* `data?: T`: Optional arbitrary payload passed to drop events.
* `disabled?: boolean`: When true, pan gesture is ignored.
* `kinetics?: DraggableKineticsConfig`:
  * `activeScale?: number`: Scale factor applied on pickup (default: `1.06`).
  * `maxVelocityTiltDeg?: number`: Max degrees of rotation driven by horizontal velocity (default: `12`).
  * `springDamping?: number`: Spring damping for drop and return physics (default: `20`).
  * `springStiffness?: number`: Spring stiffness for drop and return physics (default: `240`).
  * `returnOnReject?: boolean`: If true, springs back to origin if dropped outside a droppable (default: `true`).
  * `boundsConstraint?: { minX: number; maxX: number; minY: number; maxY: number }`: Clamps drag motion within a 2D bounding box.
* `children`: Render prop `({ isDragging }: DraggableRenderProps) => ReactNode` or static `ReactNode`.
* `accessibilityLabel?: string`: Screen reader announcement (default: `Draggable item ${id}`).

### Low-Level Hook (`useDraggable`)
For custom animated components that manage their own gestures:
```typescript
const {
  panGesture,
  animatedStyle,
  targetViewRef,
  handleLayout,
  resetPosition,
  translateX,
  translateY,
  isDragging,
} = useDraggable({ id, kinetics });
```

---

## 3. `useDroppable` & `Droppable`

Headless container primitive that registers a spatial drop target and tracks whether a draggable is hovering over it.

### Component Signature
```typescript
import { Droppable } from 'alambre';

<Droppable
  id="trash-zone"
  data={{ action: 'recycle' }}
  style={styles.zone}
  activeStyle={styles.zoneHighlighted}
>
  {({ isOver }) => (
    <Text>{isOver ? 'Release to Recycle' : 'Drag items here'}</Text>
  )}
</Droppable>
```

### Props (`DroppableProps`)
* `id: string`: Unique droppable zone identifier.
* `data?: unknown`: Optional payload attached to the `DropEvent`.
* `disabled?: boolean`: When true, hover detection ignores this zone.
* `style?: StyleProp<ViewStyle>`: Base container style.
* `activeStyle?: StyleProp<ViewStyle>`: Style merged onto container when `isOver` is true.
* `children`: Render prop `({ isOver }: DroppableRenderProps) => ReactNode` or static `ReactNode`.
* `accessibilityLabel?: string`: Screen reader label (default: `Drop target zone ${id}`).

### Low-Level Hook (`useDroppable`)
```typescript
const { isOver, targetViewRef, handleLayout, measureZone } = useDroppable({ id, data });
```

---

## 4. `SortableRow`

A complete 1D horizontal sorting container with 60fps reordering, configurable neighbor shifting, drop settle animations, and native screen reader actions.

### Signature & Props
```typescript
import {
  SortableRow,
  type SortableItem,
  type NeighborShiftMode,
  type DropAnimationMode,
} from 'alambre';

interface CardItem extends SortableItem {
  id: string;
  label: string;
}

<SortableRow<CardItem>
  items={items}
  onReorder={(newOrder) => setItems(newOrder)}
  itemWidth={72}
  gap={8}
  neighborShiftMode="glide"
  dropAnimationMode="seamless"
  dragTiltDeg={8}
  reorderThreshold={0.5}
  renderItem={(item, slotIndex, isDragging) => (
    <CardView item={item} slot={slotIndex} dragging={isDragging} />
  )}
/>
```

### Motion Configuration
* **`neighborShiftMode`**: Interpolation curve applied to adjacent cards as they shift aside:
  * `'glide'` (default): Smooth cubic-bezier timing transition (`Easing.out(Easing.cubic)`). Clean and predictable.
  * `'linear'`: Constant velocity timing transition (`Easing.linear`). Crisp and mechanical.
  * `'damped'`: Critically-damped spring physics with zero oscillation.
  * `'bounce'`: Spring physics using `springDamping` and `springStiffness`.
  * `'instant'`: Immediate repositioning without animation.
* **`dropAnimationMode`**: Settling transition when the active card is dropped:
  * `'seamless'` (default): Quick 140ms crisp glide into slot with zero lingering delay or overshoot.
  * `'bounce'`: Elastic spring settle.
  * `'impact'`: Tactile landing sequence with momentary squish (`scale: 0.92`) and rebound spring.
  * `'instant'`: Immediate snap into final slot.
* **`reorderThreshold`**: Ratio (0.1 to 0.9, default `0.5`) of slot size that must be crossed before neighboring cards begin shifting.
* **`dragTiltDeg`**: Rotation angle applied to the dragged card proportional to horizontal displacement.
* **`slowMotion`**: Scales animation durations by 4x for kinetic inspection and tuning.

### Accessibility (TalkBack / VoiceOver)
Screen readers cannot operate drag gestures. `SortableRow` automatically equips each item with:
* `accessibilityRole="button"`
* `accessibilityLabel="Item {id}, position {N} of {total}"`
* Custom accessibility actions:
  * `moveLeft`: Moves the card one slot to the left and calls `onReorder`.
  * `moveRight`: Moves the card one slot to the right and calls `onReorder`.

---

## Complete Example: Two-Zone Deck & Recycling

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DndProvider, Draggable, Droppable, type DropEvent } from 'alambre';

type Item = { id: string; name: string };

export function Inventory() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: 'Potion' },
    { id: '2', name: 'Shield' },
  ]);
  const [recycled, setRecycled] = useState<Item[]>([]);

  const handleDrop = (event: DropEvent) => {
    if (event.droppableId === 'trash') {
      const dragged = items.find((i) => i.id === event.draggableId);
      if (dragged) {
        setItems((prev) => prev.filter((i) => i.id !== dragged.id));
        setRecycled((prev) => [...prev, dragged]);
      }
    }
  };

  return (
    <DndProvider onDrop={handleDrop}>
      <View style={styles.container}>
        <View style={styles.deck}>
          {items.map((item) => (
            <Draggable key={item.id} id={item.id} kinetics={{ activeScale: 1.08 }}>
              {({ isDragging }) => (
                <View style={[styles.card, isDragging && styles.cardDragging]}>
                  <Text>{item.name}</Text>
                </View>
              )}
            </Draggable>
          ))}
        </View>

        <Droppable id="trash" style={styles.dropZone} activeStyle={styles.dropZoneActive}>
          {({ isOver }) => (
            <Text style={styles.dropText}>
              {isOver ? 'Drop to Discard' : 'Recycle Bin'}
            </Text>
          )}
        </Droppable>
      </View>
    </DndProvider>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20 },
  deck: { flexDirection: 'row', gap: 12 },
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardDragging: { backgroundColor: '#e0e7ff' },
  dropZone: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  dropZoneActive: { borderColor: '#ef4444', backgroundColor: '#fee2e2' },
  dropText: { fontSize: 14, fontWeight: '600' },
});
```
