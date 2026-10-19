import { useCallback, useMemo, useRef, useState } from 'react';
import { Gesture, type GestureType } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import {
  calculateSwipeTilt,
  resolveTossDynamics,
  type SpatialDropZone,
} from '../core/spatial';
import type { Point2D } from '../core/trajectory';
import {
  useKineticChoreography,
  type UseKineticChoreographyReturn,
} from './use-kinetic-choreography';

export interface UseSpatialTossOptions<
  T = any,
  TZone extends SpatialDropZone<T> = SpatialDropZone<T>,
> {
  /** The domain item being dragged/tossed (or alias `card`). */
  item?: T;
  card?: T;
  /** Initial resting home coordinate. */
  homeSlot: Point2D;
  /** Initial resting rotation in degrees. @default 0 */
  homeRotation?: number;
  /** Initial faceUp state for 3D flipping items. @default true */
  initialFaceUp?: boolean;
  /** Available target drop zones. */
  dropZones: readonly TZone[];
  /** Disable drag interaction. @default false */
  disabled?: boolean;
  /** Spring stiffness for landing/restitution. @default 140 */
  stiffness?: number;
  /** Maximum drag tilt angle in degrees. @default 12 */
  maxTiltAngle?: number;
  /** Scale applied while actively dragging. @default 1.08 */
  dragScale?: number;
  /** Callback fired when item successfully lands and settles in a drop zone. */
  onDropSuccess?: (item: T, targetZone: TZone, targetRotation: number) => void;
  /** Callback fired when toss misses all zones and returns to homeSlot. */
  onRestitution?: (item: T) => void;
  /** Callback fired when drag begins. */
  onDragStart?: () => void;
}

export interface UseSpatialTossReturn {
  /** Gesture.Pan() instance to pass to `<GestureDetector gesture={gesture}>`. */
  gesture: GestureType;
  /** Reanimated style for the tossed element. */
  animatedStyle: UseKineticChoreographyReturn['animatedStyle'];
  /** Whether the element is currently being dragged by the user. */
  isDragging: boolean;
  /** Current 3D faceUp boolean state. */
  faceUp: boolean;
  /** Toggles 3D flip (0° <-> 180° rotateY). */
  flip: () => void;
  /** Programmatically release/toss from a point with velocity. */
  releaseToss: (releasePoint: Point2D, velocity: { vx: number; vy: number }) => void;
  /** Underlying choreography instance for custom sequences. */
  choreo: UseKineticChoreographyReturn;
}

/**
 * Headless 2D Spatial Toss & Restitution Hook (`useSpatialToss`).
 *
 * Combines `Gesture.Pan()` drag tracking, horizontal velocity tilt, inertial endpoint projection,
 * drop-zone acceptance filtering, and critically-damped spring restitution when a throw misses.
 */
export function useSpatialToss<
  T = any,
  TZone extends SpatialDropZone<T> = SpatialDropZone<T>,
>(options: UseSpatialTossOptions<T, TZone>): UseSpatialTossReturn {
  const {
    item,
    card,
    homeSlot,
    homeRotation = 0,
    initialFaceUp,
    dropZones,
    disabled = false,
    stiffness = 140,
    maxTiltAngle = 12,
    dragScale = 1.08,
    onDropSuccess,
    onRestitution,
    onDragStart,
  } = options;

  const targetItem = (item ?? card) as T;
  const resolvedInitialFaceUp =
    initialFaceUp ??
    (targetItem && typeof targetItem === 'object' && 'faceUp' in (targetItem as Record<string, unknown>)
      ? Boolean((targetItem as Record<string, unknown>).faceUp ?? true)
      : true);

  const [isDragging, setIsDragging] = useState(false);
  const [faceUp, setFaceUp] = useState(resolvedInitialFaceUp);

  const choreo = useKineticChoreography({
    initial: {
      x: homeSlot.x,
      y: homeSlot.y,
      rotateDeg: homeRotation,
      rotateYDeg: resolvedInitialFaceUp ? 0 : 180,
      scale: 1,
      opacity: 1,
    },
    perspective: 1000,
  });

  const callbacksRef = useRef({ onDropSuccess, onRestitution, onDragStart });
  callbacksRef.current = { onDropSuccess, onRestitution, onDragStart };

  const releaseToss = useCallback(
    (releasePoint: Point2D, velocity: { vx: number; vy: number }) => {
      setIsDragging(false);

      const resolution = resolveTossDynamics<T, TZone>({
        releasePoint,
        velocity,
        dropZones,
        item: targetItem,
        homeSlot,
        homeRotation,
        stiffness,
      });

      choreo.transitionTo({
        to: {
          x: resolution.destination.x,
          y: resolution.destination.y,
          rotateDeg: resolution.targetRotation,
          scale: 1,
        },
        driver: 'spring',
        springConfig: resolution.springConfig,
        enforceCriticalDamping: true,
        onStepComplete: () => {
          if (resolution.isDropSuccess && resolution.targetZone) {
            callbacksRef.current.onDropSuccess?.(
              targetItem,
              resolution.targetZone,
              resolution.targetRotation,
            );
          } else {
            callbacksRef.current.onRestitution?.(targetItem);
          }
        },
      });
    },
    [dropZones, targetItem, homeSlot, homeRotation, stiffness, choreo],
  );

  const flip = useCallback(() => {
    setFaceUp((prev) => {
      const next = !prev;
      choreo.transitionTo({
        to: {
          rotateYDeg: next ? 0 : 180,
        },
        driver: 'spring',
        springConfig: { damping: 14, stiffness: 120 },
      });
      return next;
    });
  }, [choreo]);

  const panGesture = useMemo<GestureType>(() => {
    return Gesture.Pan()
      .enabled(!disabled)
      .onStart(() => {
        'worklet';
        runOnJS(setIsDragging)(true);
        const onStartCb = callbacksRef.current.onDragStart;
        if (onStartCb) {
          runOnJS(onStartCb)();
        }
      })
      .onUpdate((e) => {
        'worklet';
        const currentX = homeSlot.x + e.translationX;
        const currentY = homeSlot.y + e.translationY;
        const tilt = calculateSwipeTilt(e.translationX, maxTiltAngle, 180);

        choreo.updateManual({
          x: currentX,
          y: currentY,
          rotateDeg: homeRotation + tilt,
          scale: dragScale,
        });
      })
      .onEnd((e) => {
        'worklet';
        const releaseX = homeSlot.x + e.translationX;
        const releaseY = homeSlot.y + e.translationY;
        runOnJS(releaseToss)(
          { x: releaseX, y: releaseY },
          { vx: e.velocityX, vy: e.velocityY },
        );
      });
  }, [disabled, homeSlot, homeRotation, maxTiltAngle, dragScale, choreo, releaseToss]);

  return {
    gesture: panGesture,
    animatedStyle: choreo.animatedStyle,
    isDragging,
    faceUp,
    flip,
    releaseToss,
    choreo,
  };
}

export const useCardToss = useSpatialToss;
export type UseCardTossOptions<
  T = any,
  TZone extends SpatialDropZone<T> = SpatialDropZone<T>,
> = UseSpatialTossOptions<T, TZone>;
export type UseCardTossReturn = UseSpatialTossReturn;

