import {
  useCardToss as alambreUseCardToss,
  type UseCardTossOptions as AlambreUseCardTossOptions,
} from 'alambre';
import type { DropZoneBounds, PlayingCardData } from '../types';

export type UseCardTossOptions = AlambreUseCardTossOptions<PlayingCardData, DropZoneBounds>;

export function useCardToss(options: UseCardTossOptions) {
  return alambreUseCardToss<PlayingCardData, DropZoneBounds>(options);
}


