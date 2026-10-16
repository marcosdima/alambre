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
