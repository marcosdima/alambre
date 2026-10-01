import { Gesture } from 'react-native-gesture-handler';
import type {
  SharedValue,
  WithSpringConfig } from 'react-native-reanimated';
import {
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

export type SwipeDirection = 'left' | 'right' | 'none';

export interface UseSwipeableRowConfig {
  /** Positive values, e.g. [100, 200] */
  leftSnapPoints?: number[];
  /** Negative values, e.g. [-100, -200] */
  rightSnapPoints?: number[];
  /** Friction applied when dragging past the last snap point */
  friction?: number;
  /** Callback when the row snaps to a specific point */
  onSnap?: (direction: SwipeDirection, point: number) => void;
  springConfig?: WithSpringConfig;
  /** Threshold for auto-triggering actions on release */
  triggerThreshold?: number;
  /** Callback when action is auto-triggered via over-swipe */
  onActionTriggered?: (direction: SwipeDirection) => void;
}

export interface UseSwipeableRowReturn {
  translationX: SharedValue<number>;
  panGesture: ReturnType<typeof Gesture.Pan>;
  close: () => void;
  snapTo: (point: number) => void;
}

const DEFAULT_SPRING_CONFIG: WithSpringConfig = {
  damping: 20,
  stiffness: 200,
  mass: 0.6,
};

export function useSwipeableRow(
  config: UseSwipeableRowConfig = {},
): UseSwipeableRowReturn {
  const {
    leftSnapPoints = [],
    rightSnapPoints = [],
    friction = 0.5,
    onSnap,
    springConfig = DEFAULT_SPRING_CONFIG,
    triggerThreshold,
    onActionTriggered,
  } = config;

  const translationX = useSharedValue(0);
  const startX = useSharedValue(0);

  // Pre-compute boundaries
  const maxLeft = leftSnapPoints.length > 0 ? Math.max(...leftSnapPoints) : 0;
  const maxRight = rightSnapPoints.length > 0 ? Math.min(...rightSnapPoints) : 0;

  const snapPoints = [0, ...leftSnapPoints, ...rightSnapPoints];

  const handleSnap = (snappedPoint: number) => {
    if (onSnap) {
      const direction: SwipeDirection =
        snappedPoint > 0 ? 'left' : snappedPoint < 0 ? 'right' : 'none';
      onSnap(direction, snappedPoint);
    }
  };

  const snapTo = (point: number) => {
    'worklet';
    translationX.value = withSpring(point, springConfig, (isFinished) => {
      if (isFinished && onSnap) {
        runOnJS(handleSnap)(point);
      }
    });
  };

  const close = () => {
    'worklet';
    snapTo(0);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onStart(() => {
      startX.value = translationX.value;
    })
    .onUpdate((event) => {
      let nextX = startX.value + event.translationX;

      // Apply hard limit (clamp) if pulled beyond max boundaries
      if (nextX > maxLeft) {
        nextX = maxLeft;
      } else if (nextX < maxRight) {
        nextX = maxRight;
      }

      // Restrict dragging if no snap points defined for a side
      if (maxLeft === 0 && nextX > 0) {
        nextX = (nextX * friction) / (1 + nextX * 0.003);
      }
      if (maxRight === 0 && nextX < 0) {
        const overscroll = -nextX;
        nextX = -(overscroll * friction) / (1 + overscroll * 0.003);
      }

      translationX.value = nextX;
    })
    .onEnd((event) => {
      if (triggerThreshold && onActionTriggered) {
        if (translationX.value > triggerThreshold) {
          runOnJS(onActionTriggered)('left');
          snapTo(0);
          return;
        } else if (translationX.value < -triggerThreshold) {
          runOnJS(onActionTriggered)('right');
          snapTo(0);
          return;
        }
      }

      // Find closest snap point (including velocity projection for momentum)
      const projectedX = translationX.value + event.velocityX * 0.2;

      let closestPoint = 0;
      let minDistance = Infinity;

      for (const point of snapPoints) {
        const distance = Math.abs(projectedX - point);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      }

      // If swipe is strongly against the current direction, snap to 0
      if (translationX.value > 0 && event.velocityX < -500) {
        closestPoint = 0;
      } else if (translationX.value < 0 && event.velocityX > 500) {
        closestPoint = 0;
      }

      snapTo(closestPoint);
    });

  return {
    translationX,
    panGesture,
    close,
    snapTo,
  };
}
