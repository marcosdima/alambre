import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { getZoneCenter, type SpatialDropZone, type SpatialRect } from '../../core/spatial';
import type { Point2D } from '../../core/trajectory';

export interface SpatialTargetRecord<T = any> extends SpatialDropZone<T> {
  parentId?: string;
  offset?: Point2D;
  itemSize?: { width: number; height: number };
  center: Point2D;
  isMeasured: boolean;
}

export type SpatialTargetMeasurement<T = any> = SpatialTargetRecord<T>;


export interface RegisterSpatialTargetInput<T = any> {
  id: string;
  bounds: SpatialRect;
  parentId?: string;
  offset?: Point2D;
  itemSize?: { width: number; height: number };
  label?: string;
  accepts?: (item: T) => boolean;
  isMeasured?: boolean;
}

export interface SpatialSpaceContextValue {
  targets: Record<string, SpatialTargetRecord>;
  registerTarget: (input: RegisterSpatialTargetInput) => void;
  unregisterTarget: (id: string) => void;
  getTarget: (id: string) => SpatialTargetRecord | null;
  getCenter: (id: string, itemSize?: { width: number; height: number }) => Point2D;
  getDropZones: <T = any>(ids?: readonly string[]) => SpatialDropZone<T>[];
}

const SpatialSpaceContext = createContext<SpatialSpaceContextValue | null>(null);

export interface SpatialSpaceProps {
  children: ReactNode;
}

/**
 * Resolve absolute bounds inside a SpatialSpace by walking up any registered `parentId` chain
 * and applying optional explicit `offset`.
 */
function resolveAbsoluteRect(
  id: string,
  records: Record<string, SpatialTargetRecord>,
  visited = new Set<string>(),
): SpatialRect {
  const entry = records[id];
  if (!entry) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let absX = entry.x + (entry.offset?.x ?? 0);
  let absY = entry.y + (entry.offset?.y ?? 0);

  if (entry.parentId && !visited.has(entry.parentId) && records[entry.parentId]) {
    visited.add(id);
    const parentAbs = resolveAbsoluteRect(entry.parentId, records, visited);
    absX += parentAbs.x;
    absY += parentAbs.y;
  }

  return {
    x: absX,
    y: absY,
    width: entry.width,
    height: entry.height,
  };
}

function recomputeAllTargets(
  rawMap: Record<string, RegisterSpatialTargetInput>,
): Record<string, SpatialTargetRecord> {
  // First pass: create base records with local bounds
  const temp: Record<string, SpatialTargetRecord> = {};
  for (const [id, input] of Object.entries(rawMap)) {
    temp[id] = {
      id,
      x: input.bounds.x,
      y: input.bounds.y,
      width: input.bounds.width,
      height: input.bounds.height,
      parentId: input.parentId,
      offset: input.offset,
      itemSize: input.itemSize,
      label: input.label,
      accepts: input.accepts,
      center: { x: 0, y: 0 },
      isMeasured: input.isMeasured ?? true,
    };
  }

  // Second pass: resolve parent chains and centers
  const resolved: Record<string, SpatialTargetRecord> = {};
  for (const id of Object.keys(temp)) {
    const base = temp[id]!;
    const absRect = resolveAbsoluteRect(id, temp);
    const center = getZoneCenter(absRect, base.itemSize);
    resolved[id] = {
      ...base,
      x: absRect.x,
      y: absRect.y,
      width: absRect.width,
      height: absRect.height,
      center,
    };
  }

  return resolved;
}

/**
 * Headless Coordinate Space Registry (`<SpatialSpace>`).
 * Eliminates manual nested `onLayout` offset chaining across decks, hands, and drop zones.
 */
export function SpatialSpace({ children }: SpatialSpaceProps) {
  const rawTargetsRef = useRef<Record<string, RegisterSpatialTargetInput>>({});
  const [targets, setTargets] = useState<Record<string, SpatialTargetRecord>>({});

  const registerTarget = useCallback((input: RegisterSpatialTargetInput) => {
    const existing = rawTargetsRef.current[input.id];
    if (
      existing &&
      existing.bounds.x === input.bounds.x &&
      existing.bounds.y === input.bounds.y &&
      existing.bounds.width === input.bounds.width &&
      existing.bounds.height === input.bounds.height &&
      existing.parentId === input.parentId &&
      existing.offset?.x === input.offset?.x &&
      existing.offset?.y === input.offset?.y &&
      existing.itemSize?.width === input.itemSize?.width &&
      existing.itemSize?.height === input.itemSize?.height &&
      existing.isMeasured === (input.isMeasured ?? true)
    ) {
      // Update mutable callbacks (e.g. accepts) without triggering re-render
      rawTargetsRef.current[input.id] = {
        ...existing,
        label: input.label,
        accepts: input.accepts,
      };
      return;
    }

    rawTargetsRef.current = {
      ...rawTargetsRef.current,
      [input.id]: {
        ...input,
        isMeasured: input.isMeasured ?? true,
      },
    };
    setTargets(recomputeAllTargets(rawTargetsRef.current));
  }, []);

  const unregisterTarget = useCallback((id: string) => {
    if (!(id in rawTargetsRef.current)) return;
    const next = { ...rawTargetsRef.current };
    delete next[id];
    rawTargetsRef.current = next;
    setTargets(recomputeAllTargets(rawTargetsRef.current));
  }, []);

  const getTarget = useCallback(
    (id: string): SpatialTargetRecord | null => {
      return targets[id] ?? null;
    },
    [targets],
  );

  const getCenter = useCallback(
    (id: string, itemSizeOverride?: { width: number; height: number }): Point2D => {
      const record = targets[id];
      if (!record) return { x: 0, y: 0 };
      if (itemSizeOverride) {
        return getZoneCenter(record, itemSizeOverride);
      }
      return record.center;
    },
    [targets],
  );

  const getDropZones = useCallback(
    <T = any,>(ids?: readonly string[]): SpatialDropZone<T>[] => {
      const list = ids
        ? ids.map((id) => targets[id]).filter((t): t is SpatialTargetRecord => Boolean(t))
        : Object.values(targets);
      return list.map((t) => ({
        id: t.id,
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        label: t.label,
        accepts: t.accepts,
      }));
    },
    [targets],
  );

  const value = useMemo<SpatialSpaceContextValue>(
    () => ({
      targets,
      registerTarget,
      unregisterTarget,
      getTarget,
      getCenter,
      getDropZones,
    }),
    [targets, registerTarget, unregisterTarget, getTarget, getCenter, getDropZones],
  );

  return <SpatialSpaceContext.Provider value={value}>{children}</SpatialSpaceContext.Provider>;
}

export function useSpatialSpace(): SpatialSpaceContextValue {
  const ctx = useContext(SpatialSpaceContext);
  if (!ctx) {
    throw new Error('useSpatialSpace must be used within a <SpatialSpace> provider.');
  }
  return ctx;
}

export interface UseSpatialTargetOptions<T = any> {
  /** Optional parent target ID if this element is nested inside another measured container. */
  parentId?: string;
  /** Optional static coordinate offset added to measured layout. */
  offset?: Point2D;
  /** Optional item size (`{ width, height }`) to compute top-left landing coordinate that centers the item. */
  itemSize?: { width: number; height: number };
  /** Fallback bounds used before the first `onLayout` event fires. */
  fallbackBounds?: SpatialRect;
  /** Human-readable label for drop zone debugging/UI. */
  label?: string;
  /** Predicate determining if this target accepts a dropped item. */
  accepts?: (item: T) => boolean;
}

export interface UseSpatialTargetReturn {
  /** Spreadable `onLayout` handler for `<View onLayout={onLayout}>`. */
  onLayout: (event: LayoutChangeEvent) => void;
  /** Imperative bounds registration for custom or non-DOM measurement. */
  setBounds: (bounds: SpatialRect) => void;
  /** Resolved absolute bounds in the `<SpatialSpace>` coordinate frame. */
  bounds: SpatialRect;
  /** Resolved center coordinate in the `<SpatialSpace>` coordinate frame. */
  center: Point2D;
  /** Whether a real layout measurement has occurred. */
  isMeasured: boolean;
}

/**
 * Registers a spatial target or drop zone inside an enclosing `<SpatialSpace>` (or operates standalone if unmounted from a provider).
 */
export function useSpatialTarget<T = any>(
  id: string,
  options: UseSpatialTargetOptions<T> = {},
): UseSpatialTargetReturn {
  const ctx = useContext(SpatialSpaceContext);
  const {
    parentId,
    offset,
    itemSize,
    fallbackBounds = { x: 0, y: 0, width: 0, height: 0 },
    label,
    accepts,
  } = options;

  const [localBounds, setLocalBounds] = useState<SpatialRect>(fallbackBounds);
  const [localMeasured, setLocalMeasured] = useState<boolean>(false);

  // Register fallback bounds initially if inside a SpatialSpace and not yet registered
  useEffect(() => {
    if (!ctx) return;
    if (!ctx.targets[id]) {
      ctx.registerTarget({
        id,
        bounds: fallbackBounds,
        parentId,
        offset,
        itemSize,
        label,
        accepts,
        isMeasured: false,
      });
    }
    return () => {
      ctx.unregisterTarget(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, id]);

  const setBounds = useCallback(
    (nextBounds: SpatialRect) => {
      setLocalBounds(nextBounds);
      setLocalMeasured(true);
      if (ctx) {
        ctx.registerTarget({
          id,
          bounds: nextBounds,
          parentId,
          offset,
          itemSize,
          label,
          accepts,
          isMeasured: true,
        });
      }
    },
    [accepts, ctx, id, itemSize, label, offset, parentId],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setBounds({ x, y, width, height });
    },
    [setBounds],
  );

  const registered = ctx?.targets[id];

  const resolvedBounds: SpatialRect = useMemo(() => {
    if (registered) {
      return {
        x: registered.x,
        y: registered.y,
        width: registered.width,
        height: registered.height,
      };
    }
    return {
      x: localBounds.x + (offset?.x ?? 0),
      y: localBounds.y + (offset?.y ?? 0),
      width: localBounds.width,
      height: localBounds.height,
    };
  }, [localBounds, offset?.x, offset?.y, registered]);

  const resolvedCenter: Point2D = useMemo(() => {
    if (registered) {
      return registered.center;
    }
    return getZoneCenter(resolvedBounds, itemSize);
  }, [itemSize, registered, resolvedBounds]);

  return {
    onLayout,
    setBounds,
    bounds: resolvedBounds,
    center: resolvedCenter,
    isMeasured: registered ? registered.isMeasured : localMeasured,
  };
}

export interface SpatialVector {
  from: Point2D;
  to: Point2D;
  delta: Point2D;
  distance: number;
  isReady: boolean;
}

/**
 * Computes the flight vector (`from`, `to`, `delta`, `distance`) between two targets registered in `<SpatialSpace>`.
 */
export function useSpatialVector(
  fromId: string,
  toId: string,
  itemSize?: { width: number; height: number },
): SpatialVector {
  const ctx = useContext(SpatialSpaceContext);

  return useMemo(() => {
    const fromTarget = ctx?.targets[fromId];
    const toTarget = ctx?.targets[toId];
    const from = fromTarget
      ? itemSize
        ? getZoneCenter(fromTarget, itemSize)
        : fromTarget.center
      : { x: 0, y: 0 };
    const to = toTarget
      ? itemSize
        ? getZoneCenter(toTarget, itemSize)
        : toTarget.center
      : { x: 0, y: 0 };
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    return {
      from,
      to,
      delta: { x: dx, y: dy },
      distance: Math.hypot(dx, dy),
      isReady: Boolean(fromTarget && toTarget),
    };
  }, [ctx?.targets, fromId, itemSize, toId]);
}

