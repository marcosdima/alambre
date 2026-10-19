import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';
import {
  calculateHandFan,
  parabolicAltitudeCurve,
  calculateCarouselTransform,
  calculateSwipeTilt,
  pointInBounds,
  findTargetDropZone,
  getZoneCenter,
  generateStackJitter,
  projectTossLanding,
  resolveTossDynamics,
  calculateResponsiveHandFan,
  computeSpatialCascadePlan,
  sampleFlightTrajectory,
} from './spatial';
import {
  linearTrajectory,
  parabolicTrajectory,
  arcTrajectory,
  quadraticBezier,
  cubicBezier,
  interpolateScalar,
} from './trajectory';
import {
  transferVelocity,
  projectEndpoint,
  blendScalar,
  calculateCriticalDamping,
  calculateDampingRatio,
  makeCriticallyDampedConfig,
} from './handoff';

export function rubberBandFriction(overscroll: number, constant: number = 0.55): number {
  'worklet';
  return overscroll * constant;
}

/**
 * Analytical critically damped spring curve.
 * Settle with zero overshoot in closed form: f(t) = 1 - e^(-w*t) * (1 + w*t)
 */
export function criticallyDampedCurve(progress: number, omega: number = 7): number {
  'worklet';
  const p = Math.max(0, Math.min(1, progress));
  if (p >= 1) return 1;
  return 1 - Math.exp(-omega * p) * (1 + omega * p);
}

/**
 * Analytical underdamped bouncy spring curve.
 * Settle with natural tactile overshoot in closed form: f(t) = 1 - e^(-gamma*t) * cos(omega*t)
 */
export function bouncyCurve(progress: number, gamma: number = 5, omega: number = 10): number {
  'worklet';
  const p = Math.max(0, Math.min(1, progress));
  if (p >= 1) return 1;
  return 1 - Math.exp(-gamma * p) * Math.cos(omega * p);
}

/**
 * Standard cubic ease-out curve: f(t) = 1 - (1 - t)^3
 */
export function cubicEaseOutCurve(progress: number): number {
  'worklet';
  const p = Math.max(0, Math.min(1, progress));
  return 1 - Math.pow(1 - p, 3);
}

/**
 * Polynomial overshoot curve with a snappy tactile bounce:
 * Reaches ~1.05 overshoot before settling smoothly at 1.0.
 */
export function polynomialOvershootCurve(progress: number): number {
  'worklet';
  const p = Math.max(0, Math.min(1, progress));
  if (p >= 1) return 1;
  const p1 = p - 1;
  return 1 + 2.70158 * Math.pow(p1, 3) + 1.70158 * Math.pow(p1, 2);
}

export interface WavefrontPhaseOptions {
  staggerMs?: number;
  itemDuration?: number;
  totalDuration?: number;
}

/**
 * Calculates the normalized progress [0, 1] for an item `index` in a traveling wavefront
 * driven by a single master progress tau in [0, 1]. Runs purely on the UI thread.
 */
export function calculateWavefrontPhase(
  masterProgress: number,
  index: number,
  total: number,
  options: WavefrontPhaseOptions = {},
): number {
  'worklet';
  const tau = Math.max(0, Math.min(1, masterProgress));
  if (tau >= 1) return 1;
  if (tau <= 0 || total <= 0) return 0;

  const { staggerMs = 40, itemDuration = 280 } = options;
  const totalStagger = Math.max(1, (total - 1) * staggerMs);
  const totalTime = options.totalDuration ?? (totalStagger + itemDuration);

  const startFrac = ((index * staggerMs) / totalTime);
  const spanFrac = Math.max(0.001, itemDuration / totalTime);

  const raw = (tau - startFrac) / spanFrac;
  return Math.max(0, Math.min(1, raw));
}

export const kinetics = {
  spring: {
    // Existing physical ODE presets (preserved for backward compatibility)
    snappy: { damping: 20, mass: 1, stiffness: 250 } as WithSpringConfig,
    bouncy: { damping: 14, mass: 1, stiffness: 150 } as WithSpringConfig,
    gentle: { damping: 25, mass: 1, stiffness: 100 } as WithSpringConfig,
    stiff: { damping: 20, mass: 1, stiffness: 300 } as WithSpringConfig,

    // Apple-style duration-based & frame-budgeted presets (settle in bounded time)
    settled: { duration: 350, dampingRatio: 1, overshootClamping: true } as WithSpringConfig,
    snap: { duration: 300, dampingRatio: 0.85, overshootClamping: false } as WithSpringConfig,
    sheet: { duration: 300, dampingRatio: 0.82, overshootClamping: true } as WithSpringConfig,
    responsive: { duration: 220, dampingRatio: 0.95, overshootClamping: true } as WithSpringConfig,

    // Frame-budgeted thresholds to terminate micro-oscillations immediately
    budgeted: {
      damping: 20,
      mass: 1,
      stiffness: 240,
      restDisplacementThreshold: 0.5,
      restSpeedThreshold: 2,
    } as WithSpringConfig,
  },
  timing: {
    fast: { duration: 150 } as WithTimingConfig,
    base: { duration: 250 } as WithTimingConfig,
    slow: { duration: 350 } as WithTimingConfig,
    sheet: { duration: 300 } as WithTimingConfig,
  },
  curves: {
    criticallyDamped: criticallyDampedCurve,
    bouncy: bouncyCurve,
    easeOut: cubicEaseOutCurve,
    overshoot: polynomialOvershootCurve,
  },
  friction: {
    rubberBand: rubberBandFriction,
  },
  wavefront: {
    calculatePhase: calculateWavefrontPhase,
  },
  spatial: {
    parabolicAltitude: parabolicAltitudeCurve,
    calculateHandFan,
    calculateResponsiveHandFan,
    calculateCarouselTransform,
    calculateSwipeTilt,
    pointInBounds,
    findTargetDropZone,
    getZoneCenter,
    generateStackJitter,
    projectTossLanding,
    resolveTossDynamics,
    computeSpatialCascadePlan,
    sampleFlightTrajectory,
  },
  trajectory: {
    linear: linearTrajectory,
    parabolic: parabolicTrajectory,
    arc: arcTrajectory,
    quadraticBezier,
    cubicBezier,
    interpolate: interpolateScalar,
  },
  handoff: {
    transferVelocity,
    projectEndpoint,
    blend: blendScalar,
    calculateCriticalDamping,
    calculateDampingRatio,
    makeCriticallyDampedConfig,
  },
};


