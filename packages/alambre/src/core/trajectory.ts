export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Closed-form linear interpolation between two 2D points.
 * Worklet-safe, pure function.
 */
export function linearTrajectory(t: number, from: Point2D, to: Point2D): Point2D {
  'worklet';
  const progress = Math.max(0, Math.min(1, t));
  return {
    x: from.x + progress * (to.x - from.x),
    y: from.y + progress * (to.y - from.y),
  };
}

/**
 * Closed-form parabolic flight trajectory with vertical lift height.
 * Peaks at midpoint (t = 0.5) with liftHeight offset along the negative Y axis (upward).
 * Worklet-safe, pure function.
 */
export function parabolicTrajectory(
  t: number,
  from: Point2D,
  to: Point2D,
  liftHeight: number = 50,
): Point2D {
  'worklet';
  const progress = Math.max(0, Math.min(1, t));
  const altitude = 4 * progress * (1 - progress);
  return {
    x: from.x + progress * (to.x - from.x),
    y: from.y + progress * (to.y - from.y) - liftHeight * altitude,
  };
}

/**
 * Closed-form arched trajectory between two points with lateral curvature perpendicular
 * to the trajectory vector.
 * Curvature > 0 bends to the right; curvature < 0 bends to the left.
 * Worklet-safe, pure function.
 */
export function arcTrajectory(
  t: number,
  from: Point2D,
  to: Point2D,
  curvature: number = 30,
): Point2D {
  'worklet';
  const progress = Math.max(0, Math.min(1, t));
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);

  const base = linearTrajectory(progress, from, to);
  if (len < 0.001) return base;

  // Normalized perpendicular vector (-dy, dx)
  const perpX = -dy / len;
  const perpY = dx / len;

  const archAltitude = 4 * progress * (1 - progress) * curvature;
  return {
    x: base.x + perpX * archAltitude,
    y: base.y + perpY * archAltitude,
  };
}

/**
 * Quadratic Bézier curve: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
 * Worklet-safe, pure function.
 */
export function quadraticBezier(
  t: number,
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
): Point2D {
  'worklet';
  const progress = Math.max(0, Math.min(1, t));
  const inv = 1 - progress;
  const invSq = inv * inv;
  const tSq = progress * progress;

  return {
    x: invSq * p0.x + 2 * inv * progress * p1.x + tSq * p2.x,
    y: invSq * p0.y + 2 * inv * progress * p1.y + tSq * p2.y,
  };
}

/**
 * Cubic Bézier curve: B(t) = (1-t)^3 * P0 + 3(1-t)^2*t * P1 + 3(1-t)*t^2 * P2 + t^3 * P3
 * Worklet-safe, pure function.
 */
export function cubicBezier(
  t: number,
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
): Point2D {
  'worklet';
  const progress = Math.max(0, Math.min(1, t));
  const inv = 1 - progress;
  const invSq = inv * inv;
  const invCu = invSq * inv;
  const tSq = progress * progress;
  const tCu = tSq * progress;

  return {
    x:
      invCu * p0.x +
      3 * invSq * progress * p1.x +
      3 * inv * tSq * p2.x +
      tCu * p3.x,
    y:
      invCu * p0.y +
      3 * invSq * progress * p1.y +
      3 * inv * tSq * p2.y +
      tCu * p3.y,
  };
}

/**
 * Clamped 1D scalar interpolation.
 * Worklet-safe, pure function.
 */
export function interpolateScalar(
  t: number,
  from: number,
  to: number,
): number {
  'worklet';
  const progress = Math.max(0, Math.min(1, t));
  return from + progress * (to - from);
}
