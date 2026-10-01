import { useCallback, useRef } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useDnd } from './DndContext';
import type { LayoutBounds, UseDraggableOptions, UseDraggableReturn } from '../../types/dnd';

export function useDraggable<T = unknown>({
  id,
  data,
  disabled = false,
  kinetics = {},
  onDragStart: userOnDragStart,
  onDragMove: userOnDragMove,
  onDragEnd: userOnDragEnd,
}: UseDraggableOptions<T>): UseDraggableReturn {
  const {
    onDragStart: contextOnDragStart,
    onDragMove: contextOnDragMove,
    onDragEnd: contextOnDragEnd,
  } = useDnd();

  const {
    activeScale = 1.06,
    maxVelocityTiltDeg = 12,
    springDamping = 20,
    springStiffness = 240,
    returnOnReject = true,
    boundsConstraint,
  } = kinetics;

  const originBoundsRef = useRef<LayoutBounds | null>(null);
  const targetViewRef = useRef<View>(null);

  const startOffsetX = useSharedValue(0);
  const startOffsetY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const dragScale = useSharedValue(1);
  const dragRotation = useSharedValue(0);
  const zIndexVal = useSharedValue(0);

  const handleLayout = useCallback((_e: LayoutChangeEvent) => {
    targetViewRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        originBoundsRef.current = { x, y, width, height };
      }
    });
  }, []);

  const handleDragStartJS = useCallback(
    (absX?: number, absY?: number) => {
      contextOnDragStart(id, data, originBoundsRef.current, absX, absY);
      userOnDragStart?.();
    },
    [contextOnDragStart, id, data, userOnDragStart],
  );

  const handleDragMoveJS = useCallback(
    (absX?: number, absY?: number, tx = 0, ty = 0) => {
      if (typeof absX === 'number' && typeof absY === 'number') {
        contextOnDragMove(absX, absY);
      } else {
        const orig = originBoundsRef.current;
        const currentX = orig ? orig.x + orig.width / 2 + tx : tx;
        const currentY = orig ? orig.y + orig.height / 2 + ty : ty;
        contextOnDragMove(currentX, currentY);
      }
      userOnDragMove?.(tx, ty);
    },
    [contextOnDragMove, userOnDragMove],
  );

  const handleDragEndJS = useCallback(() => {
    const dropEvent = contextOnDragEnd();
    if (returnOnReject && !dropEvent) {
      userOnDragMove?.(0, 0);
    }
    userOnDragEnd?.(dropEvent ? dropEvent.droppableId : null);
    return dropEvent;
  }, [contextOnDragEnd, returnOnReject, userOnDragEnd, userOnDragMove]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(4)
    .onStart((e) => {
      'worklet';
      isDragging.value = true;
      startOffsetX.value = translateX.value;
      startOffsetY.value = translateY.value;
      zIndexVal.value = 999;
      dragScale.value = withSpring(activeScale, {
        damping: springDamping,
        stiffness: springStiffness,
      });
      runOnJS(handleDragStartJS)(e.absoluteX, e.absoluteY);
    })
    .onUpdate((e) => {
      'worklet';
      let nextX = startOffsetX.value + e.translationX;
      let nextY = startOffsetY.value + e.translationY;

      if (boundsConstraint) {
        nextX = Math.max(boundsConstraint.minX, Math.min(boundsConstraint.maxX, nextX));
        nextY = Math.max(boundsConstraint.minY, Math.min(boundsConstraint.maxY, nextY));
      }

      translateX.value = nextX;
      translateY.value = nextY;

      // Dynamic tilt based on horizontal velocity
      const tilt = interpolate(
        e.velocityX,
        [-1600, 0, 1600],
        [-maxVelocityTiltDeg, 0, maxVelocityTiltDeg],
        Extrapolation.CLAMP,
      );
      dragRotation.value = tilt;

      runOnJS(handleDragMoveJS)(e.absoluteX, e.absoluteY, nextX, nextY);
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      dragScale.value = withSpring(1, {
        damping: springDamping,
        stiffness: springStiffness,
      });
      dragRotation.value = withSpring(0, {
        damping: springDamping,
        stiffness: springStiffness,
      });

      if (returnOnReject) {
        startOffsetX.value = 0;
        startOffsetY.value = 0;
        translateX.value = withSpring(0, {
          damping: springDamping,
          stiffness: springStiffness,
        });
        translateY.value = withSpring(0, {
          damping: springDamping,
          stiffness: springStiffness,
        });
      } else {
        startOffsetX.value = translateX.value;
        startOffsetY.value = translateY.value;
      }

      zIndexVal.value = withTiming(0, { duration: 180 });
      runOnJS(handleDragEndJS)();
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      zIndex: zIndexVal.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: dragScale.value },
        { rotate: `${dragRotation.value}deg` },
      ],
      shadowOpacity: isDragging.value ? 0.35 : 0,
      shadowRadius: isDragging.value ? 12 : 0,
      elevation: isDragging.value ? 12 : 0,
    };
  });

  const resetPosition = useCallback(() => {
    startOffsetX.value = 0;
    startOffsetY.value = 0;
    translateX.value = withSpring(0, {
      damping: springDamping,
      stiffness: springStiffness,
    });
    translateY.value = withSpring(0, {
      damping: springDamping,
      stiffness: springStiffness,
    });
    userOnDragMove?.(0, 0);
  }, [translateX, translateY, startOffsetX, startOffsetY, springDamping, springStiffness, userOnDragMove]);

  return {
    panGesture,
    animatedStyle,
    targetViewRef,
    handleLayout,
    resetPosition,
    translateX,
    translateY,
    isDragging,
  };
}
