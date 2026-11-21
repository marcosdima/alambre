import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { PanGesture } from 'react-native-gesture-handler';

export interface BaseCardItem {
  id: string;
  [key: string]: any;
}

export interface CardPoint {
  x: number;
  y: number;
}

export interface UseCardTableConfig<T extends BaseCardItem> {
  initialCards: T[];
  totalCapacity?: number;
  deckPosition?: CardPoint;
  discardPosition?: CardPoint;
  handCenter?: CardPoint;
  arenaWidth?: number;
  arenaHeight?: number;
  cardWidth?: number;
  cardHeight?: number;
  spreadAngle?: number;
  arcCurvature?: number;
  baseSpacing?: number;
  defaultFlightDuration?: number;
  defaultStaggerMs?: number;
  discardRotations?: Record<string, number>;
}

export interface HandSlot {
  centerCoord: CardPoint;
  rotateDeg: number;
  zIndex: number;
}

export interface UseCardTableReturn<T extends BaseCardItem> {
  allCards: T[];
  deckCards: T[];
  handCards: T[];
  discardCards: T[];
  selectedId: string | null;
  flyingCardIds: Set<string>;
  cardDelays: Record<string, number>;
  flightDurationMs: number;
  staggerMs: number;
  arenaWidth: number;
  arenaHeight: number;
  deckPos: CardPoint;
  discardPos: CardPoint;
  handCenter: CardPoint;
  handSlots: HandSlot[];
  deal: (count?: number, customStaggerMs?: number) => void;
  draw: () => void;
  discard: (cardId?: string) => void;
  sortHand: (comparator?: (a: T, b: T) => number) => void;
  select: (cardId: string | null) => void;
  reset: () => void;
  setArenaWidth: (width: number) => void;
  setFlightDurationMs: (ms: number) => void;
  setStaggerMs: (ms: number) => void;
}

export interface RenderCardProps<T extends BaseCardItem> {
  card: T;
  isFlipped: boolean;
  isSelected: boolean;
  isFlying: boolean;
  zone: 'deck' | 'hand' | 'discard';
  onPress: () => void;
}

export interface CardTableProps<T extends BaseCardItem> {
  table: UseCardTableReturn<T>;
  renderCard: (props: RenderCardProps<T>) => ReactNode;
  renderDeckOverlay?: (props: { count: number; position: CardPoint }) => ReactNode;
  renderDiscardOverlay?: (props: { count: number; position: CardPoint }) => ReactNode;
  style?: StyleProp<ViewStyle>;
  cardWidth?: number;
  cardHeight?: number;
  springConfig?: { stiffness?: number; damping?: number };
}

export interface UseDeckSwipe3DConfig<T> {
  initialCards: T[];
  threshold?: number;
  stiffness?: number;
  damping?: number;
  maxTilt?: number;
  dismissDuration?: number;
  onDismiss?: (direction: 'left' | 'right' | 'up', card: T) => void;
}

export interface DeckSwipe3DTelemetry {
  lastAction: string;
  swipeDx: number;
  swipeDy: number;
  direction: 'left' | 'right' | 'up' | 'None' | 'Center' | 'Restored' | 'Reset';
}

export interface UseDeckSwipe3DReturn<T> {
  cards: T[];
  history: T[];
  topCard: T | undefined;
  secondCard: T | undefined;
  thirdCard: T | undefined;
  isDismissing: boolean;
  panGesture: PanGesture;
  topCardStyle: any;
  secondCardStyle: any;
  thirdCardStyle: any;
  sheenStyle: any;
  rightBadgeStyle: any;
  leftBadgeStyle: any;
  upBadgeStyle: any;
  telemetry: DeckSwipe3DTelemetry;
  triggerDismiss: (direction: 'left' | 'right' | 'up', initialVelocity?: number) => void;
  undo: () => void;
  reset: () => void;
}
