export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export type CardSize = 'sm' | 'md' | 'lg';

export interface CardDimensions {
  width: number;
  height: number;
  radius: number;
  fontSize: number;
  suitSize: number;
  centerSize: number;
}

export interface PlayingCardData {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp?: boolean;
  isArriving?: boolean;
  dealOrigin?: { x: number; y: number; flip?: boolean };
  playTarget?: { x: number; y: number; rotation?: number };
}

export interface Point2D {
  x: number;
  y: number;
}

export type DropZoneId = 'table' | 'discard' | 'deck' | 'hand' | 'opponent';

export interface DropZoneBounds {
  id: DropZoneId;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  accepts?: (card: PlayingCardData) => boolean;
}

export interface DropZoneHitResult {
  hit: boolean;
  zoneId?: DropZoneId;
  zoneCenter?: Point2D;
}

export interface HandFanSlot {
  card: PlayingCardData;
  index: number;
  total: number;
  translateX: number;
  translateY: number;
  rotateDeg: number;
  scale: number;
  zIndex: number;
  centerCoord: Point2D;
}

export interface ResponsiveHandFanOptions {
  containerWidth?: number;
  maxSpan?: number;
  baseSpacing?: number;
  spreadAngle?: number;
  arcCurvature?: number;
  selectedCardId?: string | null;
  selectedLift?: number;
  selectedScale?: number;
  selectedStraightenFactor?: number;
  centerOffset?: Point2D;
}

export interface ResponsiveHandFanResult {
  slots: HandFanSlot[];
  effectiveSpacing: number;
  totalWidth: number;
  isCompressed: boolean;
}

export type PlayerId = 'alice' | 'bob' | string;

export interface CardGameRelayEvents {
  GAME_DEAL: {
    aliceHand: PlayingCardData[];
    bobHand: PlayingCardData[];
    deckRemaining: PlayingCardData[];
    turn: PlayerId;
  };
  CARD_PLAY: {
    playerId: PlayerId;
    card: PlayingCardData;
    targetRotation: number;
    destination: DropZoneId;
    nextTurn: PlayerId;
  };
  CARD_DRAW: {
    playerId: PlayerId;
    card: PlayingCardData;
    nextTurn: PlayerId;
  };
  GAME_RESET: {
    deck: PlayingCardData[];
  };
  [key: string]: unknown;
}

