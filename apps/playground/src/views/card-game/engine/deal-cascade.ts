import {
  computeDealCascadePlan,
  sampleFlightTrajectory,
  type FlightInterpolationState,
  type SpatialCascadeOptions,
  type SpatialCascadePlan,
  type SpatialFlightSpec,
} from 'alambre';
import type { PlayingCardData } from '../types';

export type DealCascadeOptions = SpatialCascadeOptions<PlayingCardData>;
export type DealFlightSpec = SpatialFlightSpec<PlayingCardData>;
export type DealCascadePlan = SpatialCascadePlan<PlayingCardData>;
export type { FlightInterpolationState };

export { computeDealCascadePlan, sampleFlightTrajectory };

