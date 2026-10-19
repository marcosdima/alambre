import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateResponsiveHandFan,
  type HandFanSlot,
  type ResponsiveHandFanOptions,
  type ResponsiveHandFanResult,
} from '../core/spatial';

/**
 * Pure immutable array reorder helper for moving an item from `fromIndex` to `toIndex`.
 */
export function reorderHandItems<T>(
  items: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const count = items.length;
  if (count <= 1) return [...items];

  const clampedFrom = Math.max(0, Math.min(count - 1, Math.trunc(fromIndex)));
  const clampedTo = Math.max(0, Math.min(count - 1, Math.trunc(toIndex)));

  if (clampedFrom === clampedTo) return [...items];

  const next = [...items];
  const [moved] = next.splice(clampedFrom, 1);
  next.splice(clampedTo, 0, moved);
  return next;
}

/**
 * Pure spatial index resolver that maps a horizontal drag offset (`translationX`)
 * to a target slot index along a fan with `effectiveSpacing`.
 */
export function resolveHandReorderIndex(
  currentIndex: number,
  translationX: number,
  effectiveSpacing: number,
  totalCount: number,
): number {
  'worklet';
  if (totalCount <= 1 || effectiveSpacing <= 0) return 0;
  const deltaSlots = Math.round(translationX / effectiveSpacing);
  const rawTarget = currentIndex + deltaSlots;
  return Math.max(0, Math.min(totalCount - 1, rawTarget));
}

export interface UseInteractiveHandOptions<T extends { id: string }> {
  /** Input items in the hand. */
  items: readonly T[];
  /** Responsive hand fan layout options. */
  fanOptions?: Omit<ResponsiveHandFanOptions, 'selectedId' | 'selectedCardId' | 'selectedIds'>;
  /** Selection mode: single-item or multi-item combo selection. @default 'single' */
  selectionMode?: 'single' | 'multiple';
  /** Maximum number of items selectable simultaneously in 'multiple' mode. */
  maxSelected?: number;
  /** Controlled selected IDs (optional). */
  selectedIds?: readonly string[];
  /** Initial selected IDs for uncontrolled usage. */
  initialSelectedIds?: readonly string[];
  /** Upward Y displacement threshold (in points) that triggers a play/escape action. @default 55 */
  escapeThresholdY?: number;
  /** Upward Y velocity threshold (in points/sec) that triggers a play/escape action. @default 450 */
  escapeVelocityY?: number;
  /** Callback fired when the selection set changes. */
  onSelectionChange?: (selectedIds: string[], selectedItems: T[]) => void;
  /** Callback fired when an item is reordered within the hand. */
  onReorder?: (orderedItems: T[], fromIndex: number, toIndex: number) => void;
  /** Callback fired when a single item is dragged/swiped upward beyond the escape threshold. */
  onPlayItem?: (item: T) => void;
  /** Callback fired when `playSelected()` is invoked for multi-card combos. */
  onPlaySelection?: (items: T[]) => void;
}

export interface UseInteractiveHandReturn<T extends { id: string }> {
  /** Locally ordered items (preserving drag-to-reorder sequence). */
  items: T[];
  /** Full responsive fan layout result. */
  fan: ResponsiveHandFanResult<T>;
  /** Calculated slots for each item in the hand. */
  slots: HandFanSlot<T>[];
  /** Currently selected item IDs. */
  selectedIds: string[];
  /** Primary selected item ID (first selected or null). */
  selectedId: string | null;
  /** Currently selected item objects in hand order. */
  selectedItems: T[];
  /** ID of the item currently being dragged (or null). */
  draggingId: string | null;
  /** Checks whether a given item ID is currently selected. */
  isSelected: (id: string) => boolean;
  /** Toggles selection state of an item or item ID. */
  toggleSelect: (itemOrId: T | string) => void;
  /** Explicitly selects an item or item ID. */
  select: (itemOrId: T | string) => void;
  /** Explicitly deselects an item or item ID. */
  deselect: (itemOrId: T | string) => void;
  /** Clears all selected items. */
  clearSelection: () => void;
  /** Reorders an item from `fromIndex` to `toIndex`. */
  reorder: (fromIndex: number, toIndex: number) => void;
  /** Starts tracking an interactive drag for `id`. */
  beginDrag: (id: string) => void;
  /**
   * Evaluates live drag translation along X (reorder) and Y (upward escape).
   * Automatically reorders the hand in real time when crossing neighbouring slot centers.
   */
  updateDragOffset: (
    id: string,
    translationX: number,
    translationY: number,
  ) => { targetIndex: number; isEscapingUp: boolean };
  /**
   * Completes an interactive drag gesture. If upward escape threshold or velocity
   * was exceeded, triggers `onPlayItem`; otherwise commits the final slot order.
   */
  endDrag: (
    id: string,
    translationX: number,
    translationY: number,
    velocityY?: number,
  ) => { action: 'play' | 'reorder' | 'rest'; targetIndex: number };
  /** Plays all currently selected items via `onPlaySelection` (or `onPlayItem`) and clears selection. */
  playSelected: () => T[];
}

/**
 * Headless controller for an interactive card/tile hand supporting:
 * - Single and multi-item selection (`selectionMode: 'single' | 'multiple'`)
 * - Real-time horizontal drag-to-reorder within the fan
 * - Upward drag/flick escape detection to play items onto the table
 * - Responsive fan slot geometry via `calculateResponsiveHandFan`
 */
export function useInteractiveHand<T extends { id: string }>(
  options: UseInteractiveHandOptions<T>,
): UseInteractiveHandReturn<T> {
  const {
    items: incomingItems,
    fanOptions,
    selectionMode = 'single',
    maxSelected,
    selectedIds: controlledSelectedIds,
    initialSelectedIds = [],
    escapeThresholdY = 55,
    escapeVelocityY = 450,
  } = options;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Ordered items state that preserves user reordering while syncing additions/removals
  const [orderedItems, setOrderedItems] = useState<T[]>(() => [...incomingItems]);
  const [uncontrolledSelectedIds, setUncontrolledSelectedIds] = useState<string[]>(() => [
    ...initialSelectedIds,
  ]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOriginIndexRef = useRef<number>(-1);

  // Reconcile incoming items with local ordering
  useEffect(() => {
    setOrderedItems((prev) => {
      const incomingMap = new Map(incomingItems.map((item) => [item.id, item]));
      const next: T[] = [];
      const seen = new Set<string>();

      for (const existing of prev) {
        const updated = incomingMap.get(existing.id);
        if (updated !== undefined) {
          next.push(updated);
          seen.add(existing.id);
        }
      }

      for (const incoming of incomingItems) {
        if (!seen.has(incoming.id)) {
          next.push(incoming);
        }
      }

      return next;
    });
  }, [incomingItems]);

  const activeSelectedIds = useMemo(() => {
    const raw = controlledSelectedIds ? [...controlledSelectedIds] : uncontrolledSelectedIds;
    const validIds = new Set(orderedItems.map((i) => i.id));
    return raw.filter((id) => validIds.has(id));
  }, [controlledSelectedIds, orderedItems, uncontrolledSelectedIds]);

  const commitSelection = useCallback(
    (nextIds: string[]) => {
      if (!controlledSelectedIds) {
        setUncontrolledSelectedIds(nextIds);
      }
      const selectedSet = new Set(nextIds);
      const selectedObjs = orderedItems.filter((item) => selectedSet.has(item.id));
      optionsRef.current.onSelectionChange?.(nextIds, selectedObjs);
    },
    [controlledSelectedIds, orderedItems],
  );

  const isSelected = useCallback(
    (id: string) => activeSelectedIds.includes(id),
    [activeSelectedIds],
  );

  const toggleSelect = useCallback(
    (itemOrId: T | string) => {
      const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
      const exists = activeSelectedIds.includes(id);

      if (selectionMode === 'single') {
        const nextIds = exists ? [] : [id];
        commitSelection(nextIds);
        return;
      }

      if (exists) {
        commitSelection(activeSelectedIds.filter((s) => s !== id));
      } else {
        if (maxSelected !== undefined && activeSelectedIds.length >= maxSelected) {
          return;
        }
        commitSelection([...activeSelectedIds, id]);
      }
    },
    [activeSelectedIds, commitSelection, maxSelected, selectionMode],
  );

  const select = useCallback(
    (itemOrId: T | string) => {
      const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
      if (activeSelectedIds.includes(id)) return;

      if (selectionMode === 'single') {
        commitSelection([id]);
        return;
      }

      if (maxSelected !== undefined && activeSelectedIds.length >= maxSelected) {
        return;
      }
      commitSelection([...activeSelectedIds, id]);
    },
    [activeSelectedIds, commitSelection, maxSelected, selectionMode],
  );

  const deselect = useCallback(
    (itemOrId: T | string) => {
      const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
      if (!activeSelectedIds.includes(id)) return;
      commitSelection(activeSelectedIds.filter((s) => s !== id));
    },
    [activeSelectedIds, commitSelection],
  );

  const clearSelection = useCallback(() => {
    if (activeSelectedIds.length === 0) return;
    commitSelection([]);
  }, [activeSelectedIds.length, commitSelection]);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setOrderedItems((prev) => {
      const next = reorderHandItems(prev, fromIndex, toIndex);
      if (next !== prev && fromIndex !== toIndex) {
        optionsRef.current.onReorder?.(next, fromIndex, toIndex);
      }
      return next;
    });
  }, []);

  const fan = useMemo(() => {
    return calculateResponsiveHandFan(orderedItems, {
      ...fanOptions,
      selectedIds: activeSelectedIds,
    });
  }, [activeSelectedIds, fanOptions, orderedItems]);

  const beginDrag = useCallback(
    (id: string) => {
      const idx = orderedItems.findIndex((item) => item.id === id);
      dragOriginIndexRef.current = idx;
      setDraggingId(id);
    },
    [orderedItems],
  );

  const updateDragOffset = useCallback(
    (id: string, translationX: number, translationY: number) => {
      const currentIndex = orderedItems.findIndex((item) => item.id === id);
      const originIndex =
        dragOriginIndexRef.current >= 0 ? dragOriginIndexRef.current : Math.max(0, currentIndex);
      const isEscapingUp = translationY < -escapeThresholdY;

      const targetIndex = resolveHandReorderIndex(
        originIndex,
        translationX,
        fan.effectiveSpacing,
        orderedItems.length,
      );

      if (!isEscapingUp && currentIndex >= 0 && targetIndex !== currentIndex) {
        reorder(currentIndex, targetIndex);
      }

      return { targetIndex, isEscapingUp };
    },
    [escapeThresholdY, fan.effectiveSpacing, orderedItems, reorder],
  );

  const endDrag = useCallback(
    (
      id: string,
      translationX: number,
      translationY: number,
      velocityY: number = 0,
    ): { action: 'play' | 'reorder' | 'rest'; targetIndex: number } => {
      const currentIndex = orderedItems.findIndex((item) => item.id === id);
      const originIndex =
        dragOriginIndexRef.current >= 0 ? dragOriginIndexRef.current : Math.max(0, currentIndex);

      setDraggingId(null);
      dragOriginIndexRef.current = -1;

      const isEscapingUp =
        translationY < -escapeThresholdY ||
        (translationY < -18 && velocityY < -escapeVelocityY);

      if (isEscapingUp && currentIndex >= 0) {
        const item = orderedItems[currentIndex];
        if (item) {
          optionsRef.current.onPlayItem?.(item);
          return { action: 'play', targetIndex: currentIndex };
        }
      }

      const targetIndex = resolveHandReorderIndex(
        originIndex,
        translationX,
        fan.effectiveSpacing,
        orderedItems.length,
      );

      if (currentIndex >= 0 && targetIndex !== currentIndex) {
        reorder(currentIndex, targetIndex);
        return { action: 'reorder', targetIndex };
      }

      return {
        action: targetIndex !== originIndex ? 'reorder' : 'rest',
        targetIndex: currentIndex >= 0 ? currentIndex : targetIndex,
      };
    },
    [escapeThresholdY, escapeVelocityY, fan.effectiveSpacing, orderedItems, reorder],
  );

  const selectedItems = useMemo(() => {
    const set = new Set(activeSelectedIds);
    return orderedItems.filter((item) => set.has(item.id));
  }, [activeSelectedIds, orderedItems]);

  const playSelected = useCallback(() => {
    if (selectedItems.length === 0) return [];
    const toPlay = [...selectedItems];
    if (optionsRef.current.onPlaySelection) {
      optionsRef.current.onPlaySelection(toPlay);
    } else if (optionsRef.current.onPlayItem) {
      for (const item of toPlay) {
        optionsRef.current.onPlayItem(item);
      }
    }
    commitSelection([]);
    return toPlay;
  }, [commitSelection, selectedItems]);

  return {
    items: orderedItems,
    fan,
    slots: fan.slots,
    selectedIds: activeSelectedIds,
    selectedId: activeSelectedIds[0] ?? null,
    selectedItems,
    draggingId,
    isSelected,
    toggleSelect,
    select,
    deselect,
    clearSelection,
    reorder,
    beginDrag,
    updateDragOffset,
    endDrag,
    playSelected,
  };
}

