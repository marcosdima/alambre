import { calculateResponsiveHandFan as alambreCalculateResponsiveHandFan } from 'alambre';
import type {
  PlayingCardData,
  ResponsiveHandFanOptions,
  ResponsiveHandFanResult,
} from '../types';

export const DEFAULT_FAN_CONFIG = {
  baseSpacing: 38,
  spreadAngle: 5,
  arcCurvature: 3.5,
  maxSpan: 280,
  selectedLift: -32,
  selectedScale: 1.1,
  selectedStraightenFactor: 0.12,
  centerOffset: { x: 0, y: 0 },
} as const;

export function calculateResponsiveHandFan(
  cards: readonly PlayingCardData[],
  options: ResponsiveHandFanOptions = {},
): ResponsiveHandFanResult {
  return alambreCalculateResponsiveHandFan(cards, options);
}

