export { default as createStore } from './create-store';
export type { Store, StoreListener } from './create-store';
export { useExternalStore } from './use-external-store';

export {
  kinetics,
  rubberBandFriction,
  criticallyDampedCurve,
  bouncyCurve,
  cubicEaseOutCurve,
  polynomialOvershootCurve,
  calculateWavefrontPhase,
  withSettledSpring,
  DEFAULT_SPRING_ENERGY_THRESHOLD,
} from './kinetics';
export type { WavefrontPhaseOptions } from './kinetics';

export {
  parabolicAltitudeCurve,
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
  computeDealCascadePlan,
  predictHandArrivalSlot,
  sampleFlightTrajectory,
} from './spatial';
export type {
  HandFanOptions,
  HandFanItemTransform,
  ResponsiveHandFanOptions,
  HandFanSlot,
  ResponsiveHandFanResult,
  SpatialRect,
  SpatialDropZone,
  StackJitter,
  ResolveTossOptions,
  TossResolution,
  SpatialCascadeOptions,
  SpatialFlightSpec,
  SpatialCascadePlan,
  PredictArrivalSlotOptions,
  PredictedHandArrivalSlot,
  FlightInterpolationState,
  CarouselPreset,
  CarouselItemTransform,
} from './spatial';

export {
  linearTrajectory,
  parabolicTrajectory,
  arcTrajectory,
  quadraticBezier,
  cubicBezier,
  interpolateScalar,
} from './trajectory';
export type { Point2D, Point3D } from './trajectory';

export {
  transferVelocity,
  projectEndpoint,
  blendScalar,
  calculateCriticalDamping,
  calculateDampingRatio,
  makeCriticallyDampedConfig,
} from './handoff';
export type { TransferVelocityOptions, KineticVelocity2D } from './handoff';
