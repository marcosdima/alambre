export type LayoutBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DroppableRegistration = {
  id: string;
  data?: unknown;
  bounds: LayoutBounds;
  disabled?: boolean;
  measure?: () => void;
};

export type ActiveDragState<T = unknown> = {
  id: string;
  data?: T;
  touchX: number;
  touchY: number;
  originBounds: LayoutBounds | null;
  hoveredZoneId: string | null;
};

export type DropEvent<T = unknown> = {
  draggableId: string;
  draggableData?: T;
  droppableId: string;
  droppableData?: unknown;
};

export type DndContextValue = {
  registerDroppable: (zone: DroppableRegistration) => () => void;
  updateDroppableBounds: (id: string, bounds: LayoutBounds) => void;
  measureAllDroppables: () => void;
  activeDrag: ActiveDragState | null;
  onDragStart: (
    id: string,
    data?: unknown,
    originBounds?: LayoutBounds | null,
    touchX?: number,
    touchY?: number,
  ) => void;
  onDragMove: (touchX: number, touchY: number) => void;
  onDragEnd: () => DropEvent | null;
  hoveredZoneId: string | null;
};

export type DraggableKineticsConfig = {
  /** Scale factor applied when the item is picked up. @default 1.06 */
  activeScale?: number;
  /** Maximum tilt angle in degrees driven by horizontal velocity. @default 12 */
  maxVelocityTiltDeg?: number;
  /** Spring damping for release & return animation. @default 20 */
  springDamping?: number;
  /** Spring stiffness for release & return animation. @default 240 */
  springStiffness?: number;
  /** If true, item returns to origin if not dropped over a droppable zone. @default true */
  returnOnReject?: boolean;
  /** Optional boundary constraint relative to initial position. */
  boundsConstraint?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
};
