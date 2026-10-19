import type { WithSpringConfig } from 'react-native-reanimated';

export interface KineticVelocity2D {
  vx?: number;
  vy?: number;
}

export interface TransferVelocityOptions {
  /**
   * Maximum allowed initial velocity magnitude to prevent numerical spring explosion.
   * @default 3500
   */
  maxVelocity?: number;
  /**
   * Velocity dampening or multiplier scale.
   * @default 0.85
   */
  velocityScale?: number;
  /**
   * Whether to automatically enforce critical damping on the resulting spring config
   * to guarantee zero overshoot/rebound when high momentum is transferred.
   * When true, ensures damping >= 2 * sqrt(mass * stiffness).
   * @default false
   */
  enforceCriticalDamping?: boolean;
}

/**
 * Calculates the exact critical damping coefficient c_crit = 2 * sqrt(mass * stiffness).
 * At this value (damping ratio zeta = 1.0), the spring returns to its equilibrium as rapidly
 * as possible without oscillating or overshooting the destination.
 * Worklet-safe, pure function.
 */
export function calculateCriticalDamping(stiffness: number, mass: number = 1): number {
  'worklet';
  const m = Math.max(0.001, mass);
  const k = Math.max(0.001, stiffness);
  return 2 * Math.sqrt(m * k);
}

/**
 * Calculates the non-dimensional damping ratio zeta = damping / (2 * sqrt(mass * stiffness)).
 * - zeta < 1.0: Underdamped (oscillates and overshoots)
 * - zeta = 1.0: Critically damped (fastest convergence, zero overshoot)
 * - zeta > 1.0: Overdamped (sluggish convergence, zero overshoot)
 * Worklet-safe, pure function.
 */
export function calculateDampingRatio(
  damping: number,
  stiffness: number,
  mass: number = 1,
): number {
  'worklet';
  const cCrit = calculateCriticalDamping(stiffness, mass);
  return damping / cCrit;
}

/**
 * Generates a WithSpringConfig guaranteed to be critically damped (zeta = 1.0)
 * for a given stiffness and mass, with an optional initial velocity.
 * Worklet-safe, pure function.
 */
export function makeCriticallyDampedConfig(
  stiffness: number,
  mass: number = 1,
  initialVelocity?: number,
): WithSpringConfig {
  'worklet';
  const damping = calculateCriticalDamping(stiffness, mass);
  const config: WithSpringConfig = {
    damping,
    stiffness,
    mass,
  };
  if (initialVelocity !== undefined) {
    config.velocity = initialVelocity;
  }
  return config;
}

/**
 * Transfers instantaneous gesture release velocity into a Reanimated WithSpringConfig.
 * Preserves momentum across stage handoffs without deceleration dead-zones.
 * Worklet-safe, pure function.
 */
export function transferVelocity(
  velocity: KineticVelocity2D | number,
  baseSpringConfig: WithSpringConfig,
  options: TransferVelocityOptions = {},
): WithSpringConfig {
  'worklet';
  const { maxVelocity = 3500, velocityScale = 0.85, enforceCriticalDamping = false } = options;

  let rawVel = 0;
  if (typeof velocity === 'number') {
    rawVel = velocity;
  } else if (velocity) {
    const vx = velocity.vx ?? 0;
    const vy = velocity.vy ?? 0;
    // Magnitude preserving directionality of primary component
    const magnitude = Math.hypot(vx, vy);
    const sign = vy !== 0 ? Math.sign(vy) : Math.sign(vx);
    rawVel = magnitude * (sign || 1);
  }

  const scaled = rawVel * velocityScale;
  const clamped = Math.max(-maxVelocity, Math.min(maxVelocity, scaled));

  let resultingConfig: WithSpringConfig = {
    ...baseSpringConfig,
    velocity: clamped,
  };

  if (enforceCriticalDamping) {
    const stiffness = baseSpringConfig.stiffness ?? 100;
    const mass = baseSpringConfig.mass ?? 1;
    const criticalDamping = calculateCriticalDamping(stiffness, mass);
    const currentDamping = baseSpringConfig.damping ?? 10;
    resultingConfig = {
      ...resultingConfig,
      damping: Math.max(currentDamping, criticalDamping),
    } as WithSpringConfig;
  }

  return resultingConfig;
}

/**
 * Projects the natural resting point of an object under inertial friction decay.
 * Formula: destination = start + (velocity * deceleration) / (1000 * (1 - deceleration))
 * Worklet-safe, pure function.
 */
export function projectEndpoint(
  start: number,
  velocity: number,
  decelerationRate: number = 0.997,
): number {
  'worklet';
  if (Math.abs(velocity) < 1) return start;
  const d = Math.max(0.9, Math.min(0.999, decelerationRate));
  const travel = (velocity * d) / (1000 * (1 - d));
  return start + travel;
}

/**
 * Smoothly blends two scalar values with an alpha factor [0, 1].
 * Worklet-safe, pure function.
 */
export function blendScalar(from: number, to: number, alpha: number): number {
  'worklet';
  const a = Math.max(0, Math.min(1, alpha));
  return from + a * (to - from);
}
