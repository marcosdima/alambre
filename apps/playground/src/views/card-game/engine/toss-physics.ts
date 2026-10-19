import {
  calculateSwipeTilt,
  projectTossLanding,
  resolveTossDynamics,
  type ResolveTossOptions as AlambreResolveTossOptions,
  type TossResolution as AlambreTossResolution,
} from 'alambre';
import type { DropZoneBounds, PlayingCardData } from '../types';

export interface TossVelocity2D {
  vx: number;
  vy: number;
}

export type TossResolution = AlambreTossResolution<DropZoneBounds>;
export type ResolveTossOptions = AlambreResolveTossOptions<PlayingCardData, DropZoneBounds>;

export { projectTossLanding, resolveTossDynamics };


/**
 * Calculates natural card tilt in degrees while dragging horizontally.
 * Worklet-safe and pure.
 */
export function calculateDragTilt(
  translationX: number,
  maxTiltAngle: number = 14,
  maxDragSpan: number = 200,
): number {
  'worklet';
  return calculateSwipeTilt(translationX, maxTiltAngle, maxDragSpan);
}

