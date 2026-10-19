import {
  useDealCascade as alambreUseDealCascade,
  type UseDealCascadeOptions as AlambreUseDealCascadeOptions,
  type UseDealCascadeReturn as AlambreUseDealCascadeReturn,
} from 'alambre';
import type { PlayingCardData } from '../types';

export type UseDealCascadeOptions = AlambreUseDealCascadeOptions<PlayingCardData>;
export type UseDealCascadeReturn = AlambreUseDealCascadeReturn<PlayingCardData>;

export function useDealCascade(options: UseDealCascadeOptions): UseDealCascadeReturn {
  return alambreUseDealCascade<PlayingCardData>(options);
}

