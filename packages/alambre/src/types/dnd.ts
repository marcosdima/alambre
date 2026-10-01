import type { ReactNode, RefObject } from 'react';
import type { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';
import type { PanGesture } from 'react-native-gesture-handler';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';

/**
 * Screen-relative bounding box in pixels.
 */
export type LayoutBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Registration object stored in the central DnD spatial registry.
 */
export type DroppableRegistration = {
  id: string;
  data?: unknown;
  bounds: LayoutBounds;
  disabled?: boolean;
  measure?: () => void;
};

/**
 * Snapshot of the currently active drag gesture.
 */
export type ActiveDragState<T = unknown> = {
  id: string;
  data?: T;
  touchX: number;
  touchY: number;
  originBounds: LayoutBounds | null;
  hoveredZoneId: string | null;
};

/**
 * Drop event emitted when a draggable is released over an active droppable zone.
 */
export type DropEvent<T = unknown> = {
  draggableId: string;
  draggableData?: T;
  droppableId: string;
  droppableData?: unknown;
};

/**
 * Context contract exposed by DndProvider and consumed by useDnd.
 */
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

/**
 * Props for DndProvider.
 */
export type DndProviderProps = {
  children: ReactNode;
  onDrop?: (event: DropEvent) => void;
};

/**
 * Kinetic physics and boundary clamping configuration for draggables.
 */
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

/**
 * Options for useDraggable hook.
 */
export type UseDraggableOptions<T = unknown> = {
  id: string;
  data?: T;
  disabled?: boolean;
  kinetics?: DraggableKineticsConfig;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (droppableId: string | null) => void;
};

/**
 * Return contract of useDraggable hook.
 */
export type UseDraggableReturn = {
  panGesture: PanGesture;
  animatedStyle: AnimatedStyle<ViewStyle>;
  targetViewRef: RefObject<View | null>;
  handleLayout: (event: LayoutChangeEvent) => void;
  resetPosition: () => void;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
};

/**
 * Options for useDroppable hook.
 */
export type UseDroppableOptions = {
  id: string;
  data?: unknown;
  disabled?: boolean;
};

/**
 * Return contract of useDroppable hook.
 */
export type UseDroppableReturn = {
  isOver: boolean;
  targetViewRef: RefObject<View | null>;
  handleLayout: (event: LayoutChangeEvent) => void;
  measureZone: () => void;
};


/**
 * Render prop argument for Draggable.
 */
export type DraggableRenderProps = {
  isDragging: boolean;
};

/**
 * Props for Draggable component primitive.
 */
export type DraggableProps<T = unknown> = {
  id: string;
  data?: T;
  disabled?: boolean;
  kinetics?: DraggableKineticsConfig;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (droppableId: string | null) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children: ReactNode | ((props: DraggableRenderProps) => ReactNode);
};

/**
 * Render prop argument for Droppable.
 */
export type DroppableRenderProps = {
  isOver: boolean;
};

/**
 * Props for Droppable component primitive.
 */
export type DroppableProps = {
  id: string;
  data?: unknown;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children?: ReactNode | ((props: DroppableRenderProps) => ReactNode);
};

/**
 * Base constraint for sortable items in SortableRow.
 */
export type SortableItem = {
  id: string;
};

/**
 * Settling animation curve on drop in SortableRow.
 */
export type DropAnimationMode = 'seamless' | 'bounce' | 'impact' | 'instant';

/**
 * Movement interpolation curve for neighboring items in SortableRow.
 */
export type NeighborShiftMode = 'glide' | 'linear' | 'damped' | 'bounce' | 'instant';

/**
 * Props for SortableRow 1D reordering container.
 */
export type SortableRowProps<T extends SortableItem> = {
  items: T[];
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  itemWidth?: number;
  gap?: number;
  springDamping?: number;
  springStiffness?: number;
  neighborShiftMode?: NeighborShiftMode;
  dragTiltDeg?: number;
  reorderThreshold?: number;
  dropAnimationMode?: DropAnimationMode;
  slowMotion?: boolean;
  activeScale?: number;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
};
