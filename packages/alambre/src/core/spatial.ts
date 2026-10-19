import type { WithSpringConfig } from 'react-native-reanimated';
import { parabolicTrajectory, type Point2D } from './trajectory';
import {
  makeCriticallyDampedConfig,
  projectEndpoint,
  transferVelocity,
  type KineticVelocity2D,
} from './handoff';

/**
 * Closed-form normalized parabolic altitude curve:
 * Peaks at midpoint (progress = 0.5) with value 1.0, and settles at 0.0 at progress = 0 and 1.
 * Formula: f(t) = 4 * t * (1 - t)
 * Worklet-safe, executes on the UI thread without heap allocations.
 */
export function parabolicAltitudeCurve(progress: number): number {
  'worklet';
  const p = Math.max(0, Math.min(1, progress));
  return 4 * p * (1 - p);
}

export interface HandFanOptions {
  /** Spread angle per item in degrees. @default 6 */
  spreadAngle?: number;
  /** Vertical arc drop intensity in points. @default 4 */
  arcCurvature?: number;
  /** Distance between item centers in points. @default 38 */
  itemSpacing?: number;
  /** Maximum horizontal width span. If total items exceed this width, spacing is auto-compressed. @default 270 */
  maxSpan?: number;
  /** Whether this item is currently selected. @default false */
  isSelected?: boolean;
  /** Vertical lift in points when selected (negative value lifts upward). @default -36 */
  selectedLift?: number;
  /** Scale multiplier when selected. @default 1.08 */
  selectedScale?: number;
  /** Rotation straightening factor when selected (0 = fully vertical, 1 = keep fan angle). @default 0.15 */
  selectedStraightenFactor?: number;
}

export interface HandFanItemTransform {
  translateX: number;
  translateY: number;
  rotateDeg: number;
  scale: number;
  zIndex: number;
}

/**
 * Calculates domain-neutral hand fan transform for an item in a curved hand/deck layout.
 * Applies radial angle fanning, vertical arc curvature, automatic span compression, and selection lift.
 * Worklet-safe, pure function.
 */
export function calculateHandFan(
  index: number,
  total: number,
  options: HandFanOptions = {},
): HandFanItemTransform {
  'worklet';
  if (total <= 0) {
    return { translateX: 0, translateY: 0, rotateDeg: 0, scale: 1, zIndex: 0 };
  }

  const {
    spreadAngle = 6,
    arcCurvature = 4,
    itemSpacing = 38,
    maxSpan = 270,
    isSelected = false,
    selectedLift = -36,
    selectedScale = 1.08,
    selectedStraightenFactor = 0.15,
  } = options;

  const effectiveSpacing =
    total > 1 ? Math.min(itemSpacing, maxSpan / (total - 1)) : itemSpacing;

  const normalized = total > 1 ? index - (total - 1) / 2 : 0;
  const baseRotation = normalized * spreadAngle;
  const baseTranslateX = normalized * effectiveSpacing;
  const baseTranslateY = Math.abs(normalized) * arcCurvature;

  const translateX = baseTranslateX;
  const translateY = isSelected ? baseTranslateY + selectedLift : baseTranslateY;
  const rotateDeg = isSelected ? baseRotation * selectedStraightenFactor : baseRotation;
  const scale = isSelected ? selectedScale : 1;
  const zIndex = isSelected ? 999 : index + 1;

  return {
    translateX,
    translateY,
    rotateDeg,
    scale,
    zIndex,
  };
}

export type CarouselPreset = 'coverflow' | 'card-stack' | 'scale-fade' | 'flat';

export interface CarouselItemTransform {
  transform: (
    | { perspective: number }
    | { translateX: number }
    | { translateY: number }
    | { scale: number }
    | { rotateY: string }
    | { rotateZ: string }
  )[];
  opacity: number;
  zIndex: number;
}

/**
 * Calculates domain-neutral visual transformations for carousel items based on normalized distance from center.
 * d = (scrollX - itemIndex * snapInterval) / snapInterval
 * Pure worklet executing on the UI thread without allocations.
 */
export function calculateCarouselTransform(
  normalizedDistance: number,
  preset: CarouselPreset = 'scale-fade',
): CarouselItemTransform {
  'worklet';
  const d = normalizedDistance;
  const absD = Math.abs(d);

  if (preset === 'flat') {
    return {
      transform: [],
      opacity: 1,
      zIndex: 1,
    };
  }

  if (preset === 'coverflow') {
    const clampedD = Math.max(-2, Math.min(2, d));
    const rotateY = -clampedD * 38;
    const scale = Math.max(0.72, 1 - absD * 0.14);
    const translateX = -d * 22;
    const opacity = Math.max(0.4, 1 - absD * 0.25);
    const zIndex = Math.round(100 - absD * 10);

    return {
      transform: [
        { perspective: 800 },
        { translateX },
        { rotateY: `${rotateY}deg` },
        { scale },
      ],
      opacity,
      zIndex,
    };
  }

  if (preset === 'card-stack') {
    let translateX = 0;
    let scale = 1;
    let opacity = 1;
    let zIndex = 10;

    if (d < 0) {
      translateX = d * 16;
      scale = Math.max(0.8, 1 + d * 0.1);
      opacity = Math.max(0, 1 + d * 0.6);
      zIndex = Math.round(10 + d);
    } else {
      translateX = d * 18;
      scale = Math.max(0.75, 1 - d * 0.08);
      opacity = Math.max(0.2, 1 - d * 0.2);
      zIndex = Math.round(10 - d);
    }

    return {
      transform: [{ translateX }, { scale }],
      opacity,
      zIndex,
    };
  }

  // default: 'scale-fade'
  const scale = Math.max(0.8, 1 - Math.min(absD * 0.16, 0.3));
  const opacity = Math.max(0.4, 1 - Math.min(absD * 0.45, 0.6));
  const zIndex = Math.round(50 - absD * 5);

  return {
    transform: [{ scale }],
    opacity,
    zIndex,
  };
}

/**
 * Calculates rotation tilt angle in degrees for horizontal swipe drag gestures.
 * Clamps to [-maxTiltAngle, maxTiltAngle].
 * Pure worklet executing on the UI thread.
 */
export function calculateSwipeTilt(
  translateX: number,
  maxTiltAngle: number = 14,
  maxDistance: number = 240,
): number {
  'worklet';
  if (maxDistance <= 0) return 0;
  const ratio = Math.max(-1, Math.min(1, translateX / maxDistance));
  return ratio * maxTiltAngle;
}

// ============================================================================
// 2D Spatial Bounds, Hit-Testing, Stack Jitter & Toss Dynamics (Proposal 12)
// ============================================================================

export interface SpatialRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpatialDropZone<T = any> extends SpatialRect {
  id: string;
  label?: string;
  accepts?: (item: T) => boolean;
}

/**
 * Checks whether a 2D point is inside an axis-aligned bounding box (AABB),
 * with optional uniform expansion padding for forgiving touch targets.
 * Worklet-safe and pure.
 */
export function pointInBounds(
  point: Point2D,
  bounds: SpatialRect,
  padding: number = 0,
): boolean {
  'worklet';
  const minX = bounds.x - padding;
  const maxX = bounds.x + bounds.width + padding;
  const minY = bounds.y - padding;
  const maxY = bounds.y + bounds.height + padding;

  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

/**
 * Finds the first drop zone that contains the given point and accepts the item.
 * Worklet-safe and pure.
 */
export function findTargetDropZone<T = any, TZone extends SpatialDropZone<T> = SpatialDropZone<T>>(
  point: Point2D,
  zones: readonly TZone[],
  item?: T,
  padding: number = 10,
): TZone | null {
  'worklet';
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i]!;
    if (pointInBounds(point, zone, padding)) {
      if (item === undefined || !zone.accepts || zone.accepts(item)) {
        return zone;
      }
    }
  }
  return null;
}

/**
 * Computes the pixel center of a spatial rectangle or centers an item of `itemSize` within `bounds`.
 * Worklet-safe and pure.
 */
export function getZoneCenter(
  bounds: SpatialRect,
  itemSize?: { width: number; height: number },
): Point2D {
  'worklet';
  if (itemSize) {
    return {
      x: Math.round(bounds.x + (bounds.width - itemSize.width) / 2),
      y: Math.round(bounds.y + (bounds.height - itemSize.height) / 2),
    };
  }
  return {
    x: Math.round(bounds.x + bounds.width / 2),
    y: Math.round(bounds.y + bounds.height / 2),
  };
}

/**
 * Fast 32-bit integer mixing hash (FNV-1a + finalizer) for pseudo-random stack jitter.
 * Worklet-safe and pure.
 */
function hashSpatialKey(str: string): number {
  'worklet';
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export interface StackJitter {
  rotation: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Generates organic, subtle angular and spatial jitter for realistic pile/table stacking.
 * Returns deterministic rotation within [-maxAngle, maxAngle] and offsets within [-maxOffset, maxOffset].
 * Worklet-safe and pure.
 */
export function generateStackJitter(
  key: string | number,
  maxAngle: number = 12,
  maxOffset: number = 5,
): StackJitter {
  'worklet';
  const seed = typeof key === 'number' ? key * 2654435761 : hashSpatialKey(String(key));

  const factorRot = ((seed % 1000) / 500) - 1.0;
  const factorX = (((seed >>> 4) % 1000) / 500) - 1.0;
  const factorY = (((seed >>> 8) % 1000) / 500) - 1.0;

  return {
    rotation: Math.round(factorRot * maxAngle * 10) / 10,
    offsetX: Math.round(factorX * maxOffset),
    offsetY: Math.round(factorY * maxOffset),
  };
}

export interface TossResolution<TZone extends SpatialDropZone<any> = SpatialDropZone<any>> {
  targetZone: TZone | null;
  destination: Point2D;
  projectedLanding: Point2D;
  targetRotation: number;
  springConfig: WithSpringConfig;
  isDropSuccess: boolean;
}

export interface ResolveTossOptions<T = any, TZone extends SpatialDropZone<T> = SpatialDropZone<T>> {
  /** The position where the gesture was released. */
  releasePoint: Point2D;
  /** Instantaneous gesture release velocity in px/s. */
  velocity: { vx: number; vy: number };
  /** Available target drop zones on the surface. */
  dropZones: readonly TZone[];
  /** Item currently being tossed (optional if no zone acceptance filter). */
  item?: T;
  /** Alias for `item` (backward-compatible with card-game testbeds). */
  card?: T;
  /** Optional key for deterministic stack jitter when landing on a zone. */
  jitterKey?: string | number;
  /** Resting home slot coordinate (used as fallback destination if toss misses drop zones). */
  homeSlot: Point2D;
  /** Home slot resting rotation angle. @default 0 */
  homeRotation?: number;
  /** Spring stiffness for landing animation. @default 140 */
  stiffness?: number;
  /** Deceleration rate for inertial projection. @default 0.996 */
  decelerationRate?: number;
  /** Maximum release velocity to transfer into spring momentum. @default 3200 */
  maxVelocity?: number;
}

/**
 * Projects the natural resting point of a 2D toss trajectory under inertial friction.
 * Worklet-safe and pure.
 */
export function projectTossLanding(
  start: Point2D,
  velocity: KineticVelocity2D,
  decelerationRate: number = 0.996,
): Point2D {
  'worklet';
  return {
    x: Math.round(projectEndpoint(start.x, velocity.vx ?? 0, decelerationRate)),
    y: Math.round(projectEndpoint(start.y, velocity.vy ?? 0, decelerationRate)),
  };
}

/**
 * Resolves the final destination and critically-damped spring dynamics of a spatial toss.
 * If projected landing or release point intersects a valid drop zone:
 *   - Settles into zone center with organic stack jitter.
 * If toss misses all drop zones:
 *   - Springs back to its home slot with critically-damped restitution.
 * Worklet-safe and pure.
 */
export function resolveTossDynamics<T = any, TZone extends SpatialDropZone<T> = SpatialDropZone<T>>(
  options: ResolveTossOptions<T, TZone>,
): TossResolution<TZone> {
  'worklet';
  const {
    releasePoint,
    velocity,
    dropZones,
    item,
    card,
    jitterKey,
    homeSlot,
    homeRotation = 0,
    stiffness = 140,
    decelerationRate = 0.996,
    maxVelocity = 3200,
  } = options;

  const targetItem = (item ?? card) as T | undefined;
  const projectedLanding = projectTossLanding(releasePoint, velocity, decelerationRate);

  const targetZone =
    findTargetDropZone<T, TZone>(projectedLanding, dropZones, targetItem, 15) ??
    findTargetDropZone<T, TZone>(releasePoint, dropZones, targetItem, 10);

  const baseConfig = makeCriticallyDampedConfig(stiffness, 1);
  const springConfig = transferVelocity(velocity, baseConfig, {
    maxVelocity,
    velocityScale: 0.8,
    enforceCriticalDamping: true,
  });

  if (targetZone) {
    const center = getZoneCenter(targetZone);
    const derivedKey =
      jitterKey ??
      (targetItem && typeof targetItem === 'object' && 'id' in (targetItem as Record<string, unknown>)
        ? String((targetItem as Record<string, unknown>).id)
        : targetZone.id);
    const jitter = generateStackJitter(derivedKey, 12, 6);

    return {
      targetZone,
      destination: {
        x: center.x + jitter.offsetX,
        y: center.y + jitter.offsetY,
      },
      projectedLanding,
      targetRotation: jitter.rotation,
      springConfig,
      isDropSuccess: true,
    };
  }

  return {
    targetZone: null,
    destination: homeSlot,
    projectedLanding,
    targetRotation: homeRotation,
    springConfig,
    isDropSuccess: false,
  };
}

// ============================================================================
// Responsive Hand Fan & Spatial Cascade Trajectory Planner (Proposal 13)
// ============================================================================

export interface ResponsiveHandFanOptions {
  /** Measured width of the hand container in points. */
  containerWidth?: number;
  /** Maximum allowed span between outermost item centers. @default 280 */
  maxSpan?: number;
  /** Ideal horizontal spacing between centers when unconstrained. @default 38 */
  baseSpacing?: number;
  /** Angular spread per item in degrees. @default 5 */
  spreadAngle?: number;
  /** Vertical arc curvature drop in points. @default 3.5 */
  arcCurvature?: number;
  /** Single selected item ID (or alias `selectedCardId`). */
  selectedId?: string | null;
  selectedCardId?: string | null;
  /** Multi-selected item IDs for combo selection. */
  selectedIds?: readonly string[] | ReadonlySet<string>;
  /** Vertical lift when selected (negative = up). @default -32 */
  selectedLift?: number;
  /** Scale multiplier when selected. @default 1.1 */
  selectedScale?: number;
  /** Straighten factor when selected. @default 0.12 */
  selectedStraightenFactor?: number;
  /** Center point of the hand container in parent coordinate space. @default { x: 0, y: 0 } */
  centerOffset?: Point2D;
}

export interface HandFanSlot<T = any> {
  item: T;
  /** Alias for `item` (backward-compatible with card-game testbeds). */
  card: T;
  index: number;
  total: number;
  translateX: number;
  translateY: number;
  rotateDeg: number;
  scale: number;
  zIndex: number;
  isSelected: boolean;
  /** Absolute center coordinate of this slot in parent/arena space. */
  centerCoord: Point2D;
}

export interface ResponsiveHandFanResult<T = any> {
  slots: HandFanSlot<T>[];
  effectiveSpacing: number;
  totalWidth: number;
  isCompressed: boolean;
}

/**
 * Calculates a responsive, auto-compressing hand fan layout for a collection of items.
 * Supports both single selection (`selectedId` / `selectedCardId`) and multi-selection (`selectedIds`).
 * Pure function, non-mutating.
 */
export function calculateResponsiveHandFan<T extends { id: string }>(
  items: readonly T[],
  options: ResponsiveHandFanOptions = {},
): ResponsiveHandFanResult<T> {
  const total = items.length;
  if (total === 0) {
    return {
      slots: [],
      effectiveSpacing: 0,
      totalWidth: 0,
      isCompressed: false,
    };
  }

  const {
    containerWidth,
    maxSpan: customMaxSpan,
    baseSpacing = 38,
    spreadAngle = 5,
    arcCurvature = 3.5,
    selectedId,
    selectedCardId,
    selectedIds,
    selectedLift = -32,
    selectedScale = 1.1,
    selectedStraightenFactor = 0.12,
    centerOffset = { x: 0, y: 0 },
  } = options;

  const activeSingleId = selectedId !== undefined ? selectedId : selectedCardId ?? null;

  const isItemSelected = (id: string): boolean => {
    if (activeSingleId !== null && activeSingleId === id) return true;
    if (!selectedIds) return false;
    if (Array.isArray(selectedIds)) {
      return selectedIds.includes(id);
    }
    return (selectedIds as ReadonlySet<string>).has(id);
  };

  const availableSpan = containerWidth
    ? Math.max(80, containerWidth - 90)
    : customMaxSpan ?? 280;

  const effectiveSpacing =
    total > 1 ? Math.min(baseSpacing, availableSpan / (total - 1)) : baseSpacing;

  const isCompressed = effectiveSpacing < baseSpacing;
  const compressionRatio = isCompressed ? effectiveSpacing / baseSpacing : 1;
  const effectiveSpreadAngle = spreadAngle * Math.max(0.65, compressionRatio);

  const slots: HandFanSlot<T>[] = items.map((item, index) => {
    const isSelected = isItemSelected(item.id);

    const transform = calculateHandFan(index, total, {
      spreadAngle: effectiveSpreadAngle,
      arcCurvature,
      itemSpacing: effectiveSpacing,
      maxSpan: availableSpan,
      isSelected,
      selectedLift,
      selectedScale,
      selectedStraightenFactor,
    });

    const centerCoord: Point2D = {
      x: Math.round(centerOffset.x + transform.translateX),
      y: Math.round(centerOffset.y + transform.translateY),
    };

    return {
      item,
      card: item,
      index,
      total,
      translateX: transform.translateX,
      translateY: transform.translateY,
      rotateDeg: transform.rotateDeg,
      scale: transform.scale,
      zIndex: transform.zIndex,
      isSelected,
      centerCoord,
    };
  });

  const totalWidth = total > 1 ? Math.round((total - 1) * effectiveSpacing) : 0;

  return {
    slots,
    effectiveSpacing,
    totalWidth,
    isCompressed,
  };
}

export interface SpatialCascadeOptions<T = any> {
  /** Center point where the source/deck is located (or alias `deckOrigin`). */
  origin?: Point2D;
  deckOrigin?: Point2D;
  /** Center point of the receiving hand/target area (or alias `handCenter`). */
  targetCenter?: Point2D;
  handCenter?: Point2D;
  /** Width of the hand/target container for auto-compression calculations (or alias `handContainerWidth`). */
  containerWidth?: number;
  handContainerWidth?: number;
  /** Items currently in the hand/target before this deal starts (or alias `currentHand`). @default [] */
  currentItems?: readonly T[];
  currentHand?: readonly T[];
  /** Delay in milliseconds between consecutive launches. @default 90 */
  staggerDelayMs?: number;
  /** Travel duration in milliseconds for each individual flight. @default 340 */
  flightDurationMs?: number;
  /** Peak parabolic altitude in points (Y lift). @default 55 */
  liftHeight?: number;
  /** Peak scale multiplier at apex of trajectory. @default 1.12 */
  peakScale?: number;
  /** Whether the item flips mid-air (180° rotateY) from face-down to face-up. @default true */
  flipOnFly?: boolean;
}

export interface SpatialFlightSpec<T = any> {
  item: T;
  /** Alias for `item` (backward-compatible with card-game testbeds). */
  card: T;
  index: number;
  totalDealt: number;
  from: Point2D;
  to: Point2D;
  fromRotation: number;
  targetRotation: number;
  startDelayMs: number;
  durationMs: number;
  landingTimeMs: number;
  liftHeight: number;
  peakScale: number;
  flipOnFly: boolean;
  targetSlotIndex: number;
}

export interface SpatialCascadePlan<T = any> {
  specs: SpatialFlightSpec<T>[];
  totalDurationMs: number;
  targetTotal: number;
  targetHandTotal: number;
}

/**
 * Computes the complete deterministic trajectory plan for dealing/launching a batch of items
 * in a cascaded sequence into a responsive hand fan.
 * Pure function, non-mutating.
 */
export function computeSpatialCascadePlan<T extends { id: string }>(
  itemsToDeal: readonly T[],
  options: SpatialCascadeOptions<T>,
): SpatialCascadePlan<T> {
  const existing = options.currentItems ?? options.currentHand ?? [];
  const count = itemsToDeal.length;
  if (count === 0) {
    return {
      specs: [],
      totalDurationMs: 0,
      targetTotal: existing.length,
      targetHandTotal: existing.length,
    };
  }

  const {
    origin,
    deckOrigin,
    targetCenter,
    handCenter,
    containerWidth,
    handContainerWidth,
    staggerDelayMs = 90,
    flightDurationMs = 340,
    liftHeight = 55,
    peakScale = 1.12,
    flipOnFly = true,
  } = options;

  const sourceOrigin = origin ?? deckOrigin ?? { x: 0, y: 0 };
  const resolvedCenter = targetCenter ?? handCenter ?? { x: 0, y: 0 };
  const resolvedWidth = containerWidth ?? handContainerWidth;
  const simulatedHand: T[] = [...existing, ...itemsToDeal];
  const targetHandTotal = simulatedHand.length;

  const fanResult = calculateResponsiveHandFan(simulatedHand, {
    containerWidth: resolvedWidth,
    centerOffset: resolvedCenter,
  });

  const specs: SpatialFlightSpec<T>[] = itemsToDeal.map((item, dealIndex) => {
    const targetSlotIndex = existing.length + dealIndex;
    const targetSlot = fanResult.slots[targetSlotIndex]!;

    const startDelayMs = dealIndex * staggerDelayMs;
    const landingTimeMs = startDelayMs + flightDurationMs;

    return {
      item,
      card: item,
      index: dealIndex,
      totalDealt: count,
      from: sourceOrigin,
      to: targetSlot.centerCoord,
      fromRotation: 0,
      targetRotation: targetSlot.rotateDeg,
      startDelayMs,
      durationMs: flightDurationMs,
      landingTimeMs,
      liftHeight,
      peakScale,
      flipOnFly,
      targetSlotIndex,
    };
  });

  const totalDurationMs =
    specs.length > 0 ? specs[specs.length - 1]!.landingTimeMs : 0;

  return {
    specs,
    totalDurationMs,
    targetTotal: targetHandTotal,
    targetHandTotal,
  };
}

export const computeDealCascadePlan = computeSpatialCascadePlan;

export interface FlightInterpolationState {
  x: number;
  y: number;
  scale: number;
  rotateZDeg: number;
  rotateYDeg: number;
  altitude: number;
  isFrontFacing: boolean;
}

/**
 * Computes instantaneous 3D parabolic flight state at normalized progress t in [0, 1].
 * Worklet-safe, allocation-free calculation.
 */
export function sampleFlightTrajectory<T = any>(
  spec: Pick<
    SpatialFlightSpec<T>,
    'from' | 'to' | 'liftHeight' | 'peakScale' | 'fromRotation' | 'targetRotation' | 'flipOnFly'
  >,
  progress: number,
): FlightInterpolationState {
  'worklet';
  const t = Math.max(0, Math.min(1, progress));
  const altitude = parabolicAltitudeCurve(t);

  const pos = parabolicTrajectory(t, spec.from, spec.to, spec.liftHeight);
  const scale = 1.0 + altitude * (spec.peakScale - 1.0);
  const rotateZDeg = spec.fromRotation + t * (spec.targetRotation - spec.fromRotation);
  const rotateYDeg = spec.flipOnFly ? (1.0 - t) * 180 : 0;
  const isFrontFacing = Math.abs(rotateYDeg % 360) <= 90;

  return {
    x: pos.x,
    y: pos.y,
    scale,
    rotateZDeg,
    rotateYDeg,
    altitude,
    isFrontFacing,
  };
}

