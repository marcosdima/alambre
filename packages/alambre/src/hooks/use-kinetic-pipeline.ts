import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  cancelAnimation,
  useReducedMotion,
  Easing,
  type SharedValue,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { parabolicAltitudeCurve } from '../core/spatial';
import { kinetics } from '../core/kinetics';

export type KineticPipelineStage = 'idle' | 'drag' | 'flight' | 'landing' | 'settled' | string;

export interface Point2D {
  x: number;
  y: number;
}

export interface KineticVelocity2D {
  vx: number;
  vy: number;
}

export interface TransitionFlightOptions {
  /** Origin coordinates. If omitted, seamlessly begins from current `translateX` and `translateY` shared values. */
  from?: Point2D;
  /** Destination target coordinates. */
  to: Point2D;
  /** Starting rotation in degrees. If omitted, uses current `rotateDeg` shared value. */
  fromRotation?: number;
  /** Target rotation in degrees upon reaching destination. @default 0 */
  targetRotation?: number;
  /** Initial release velocity from Gesture.Pan. Used to dynamically scale flight trajectory momentum. */
  initialVelocity?: KineticVelocity2D;
  /** Flight duration in milliseconds. @default 380 */
  durationMs?: number;
  /** Peak parabolic vertical lift in points (positive lifts upward). @default 50 */
  liftHeight?: number;
  /** Peak scale multiplier at flight midpoint. @default 1.12 */
  peakScale?: number;
  /** Landing spring configuration when impacting target surface. */
  landingSpringConfig?: WithSpringConfig;
  /** Optional callback fired when landing stage begins. */
  onLanding?: () => void;
  /** Optional callback fired when flight and landing have settled. */
  onSettled?: () => void;
}

interface ActiveFlightCallbacks {
  targetX: number;
  targetY: number;
  targetRot: number;
  landingSpringConfig?: WithSpringConfig;
  onLanding?: () => void;
  onSettled?: () => void;
}

export interface QueueItem<TContext = unknown> {
  id?: string;
  options: TransitionFlightOptions;
  context?: TContext;
}

export interface UseKineticPipelineOptions<TStage extends string = KineticPipelineStage, TContext = unknown> {
  /** Initial stage of the pipeline. @default 'idle' */
  initialStage?: TStage;
  /** Context payload associated with the pipeline item (e.g. card id, data). */
  initialContext?: TContext;
  /** Default flight duration in ms. @default 380 */
  flightDuration?: number;
  /** Default parabolic lift height in points. @default 50 */
  liftHeight?: number;
  /** Default peak scale at mid-flight. @default 1.12 */
  peakScale?: number;
  /** Force reduced motion (instant snap without curves). */
  forceReducedMotion?: boolean;
  /** Callback fired whenever the pipeline enters a new stage. */
  onStageChange?: (toStage: TStage, fromStage: TStage, context: TContext) => void;
  /** Callback fired when pipeline completes a flight or sequence. */
  onComplete?: (context: TContext) => void;
}

export interface UseKineticPipelineReturn<TStage extends string = KineticPipelineStage, TContext = unknown> {
  /** Current active stage of the pipeline. */
  stage: TStage;
  /** Shared value indicating current stage for worklet checks. */
  stageShared: SharedValue<string>;
  /** Whether the pipeline is currently animating through an active transition. */
  isTransitioning: boolean;
  /** Current context payload. */
  context: TContext;
  /** Update context payload. */
  setContext: (ctx: TContext | ((prev: TContext) => TContext)) => void;

  /** Continuous UI-thread shared values across all stages (zero flash). */
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotateDeg: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  progress: SharedValue<number>;

  /** Animated style object directly usable on `<Animated.View style={animatedStyle}>`. */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;

  /** Manually update position during drag/touch interaction (worklet-safe and JS-callable). */
  updatePosition: (x: number, y: number, rotation?: number, scale?: number) => void;

  /** Transition from current position into ballistic flight toward a target point. */
  transitionToFlight: (options: TransitionFlightOptions) => void;

  /** Transition to a custom stage. */
  transitionTo: (nextStage: TStage, customHandler?: () => void) => void;

  /** Reset pipeline back to idle at specified or origin coordinates. */
  reset: (atPosition?: { x?: number; y?: number; rotation?: number; scale?: number; opacity?: number }) => void;

  /** Queue management for multi-stage or multi-item sequences. */
  queueLength: number;
  enqueue: (item: QueueItem<TContext>) => void;
  enqueueBatch: (items: QueueItem<TContext>[]) => void;
  clearQueue: () => void;
}

/**
 * Headless Kinetic Pipeline & Stage Handoff Coordinator (`useKineticPipeline`).
 *
 * Coordinates multi-stage kinetic interactions (Drag -> Ballistic Flight -> Landing Impact -> Settled)
 * with continuous UI-thread shared values, preserving initial gesture velocity without unmount/remount
 * visual flashing or coordinate drift.
 */
export function useKineticPipeline<TStage extends string = KineticPipelineStage, TContext = unknown>(
  options: UseKineticPipelineOptions<TStage, TContext> = {},
): UseKineticPipelineReturn<TStage, TContext> {
  const {
    initialStage = 'idle' as TStage,
    initialContext = undefined as unknown as TContext,
    flightDuration = 380,
    liftHeight = 50,
    peakScale = 1.12,
    forceReducedMotion = false,
    onStageChange,
    onComplete,
  } = options;

  const systemReducedMotion = useReducedMotion();
  const isReducedMotion = forceReducedMotion || Boolean(systemReducedMotion);

  const [stage, setStage] = useState<TStage>(initialStage);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [context, setContext] = useState<TContext>(initialContext);
  const [queue, setQueue] = useState<QueueItem<TContext>[]>([]);
  const queueRef = useRef<QueueItem<TContext>[]>([]);
  const stageRef = useRef<TStage>(initialStage);
  const isTransitioningRef = useRef<boolean>(false);

  // UI-thread continuous shared values
  const stageShared = useSharedValue<string>(initialStage);
  const translateX = useSharedValue<number>(0);
  const translateY = useSharedValue<number>(0);
  const rotateDeg = useSharedValue<number>(0);
  const scale = useSharedValue<number>(1);
  const opacity = useSharedValue<number>(1);
  const progress = useSharedValue<number>(0);

  // Flight trajectory shared boundary values
  const fromXShared = useSharedValue<number>(0);
  const fromYShared = useSharedValue<number>(0);
  const fromRotShared = useSharedValue<number>(0);
  const toXShared = useSharedValue<number>(0);
  const toYShared = useSharedValue<number>(0);
  const targetRotShared = useSharedValue<number>(0);
  const liftShared = useSharedValue<number>(liftHeight);
  const peakScaleShared = useSharedValue<number>(peakScale);

  // Fresh callbacks ref for safe Reanimated runOnJS bridge
  const callbacksRef = useRef({
    onStageChange,
    onComplete,
    context,
    isReducedMotion,
    flightDuration,
    liftHeight,
    peakScale,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStageChange,
      onComplete,
      context,
      isReducedMotion,
      flightDuration,
      liftHeight,
      peakScale,
    };
  }, [
    onStageChange,
    onComplete,
    context,
    isReducedMotion,
    flightDuration,
    liftHeight,
    peakScale,
  ]);

  // Clean unmount safety
  useEffect(() => {
    return () => {
      cancelAnimation(progress);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(rotateDeg);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [progress, translateX, translateY, rotateDeg, scale, opacity]);

  // Animated styles driven continuously on the UI thread
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    if (stageShared.value === 'flight') {
      const t = progress.value;
      const parabolic = parabolicAltitudeCurve(t);
      const curX = fromXShared.value + t * (toXShared.value - fromXShared.value);
      const curY =
        fromYShared.value +
        t * (toYShared.value - fromYShared.value) -
        liftShared.value * parabolic;
      const curRot =
        fromRotShared.value + t * (targetRotShared.value - fromRotShared.value);
      const curScale = 1 + (peakScaleShared.value - 1) * parabolic;

      return {
        opacity: opacity.value,
        transform: [
          { translateX: curX },
          { translateY: curY },
          { rotate: `${curRot}deg` },
          { scale: curScale * scale.value },
        ],
      };
    }

    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotateDeg.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  // JS Lifecycle Dispatchers
  const dispatchStageChange = useCallback((toSt: TStage, fromSt: TStage) => {
    stageRef.current = toSt;
    setStage(toSt);
    callbacksRef.current.onStageChange?.(toSt, fromSt, callbacksRef.current.context);
  }, []);

  const dispatchComplete = useCallback(() => {
    isTransitioningRef.current = false;
    setIsTransitioning(false);
    callbacksRef.current.onComplete?.(callbacksRef.current.context);
  }, []);

  // Manual Position Update (e.g. during Pan gesture drag)
  const updatePosition = useCallback(
    (x: number, y: number, rot = 0, sc = 1) => {
      'worklet';
      stageShared.value = 'drag';
      translateX.value = x;
      translateY.value = y;
      rotateDeg.value = rot;
      scale.value = sc;
    },
    [rotateDeg, scale, stageShared, translateX, translateY],
  );

  // Transition to Custom Stage
  const transitionTo = useCallback(
    (nextStage: TStage, customHandler?: () => void) => {
      const prev = stageRef.current;
      stageRef.current = nextStage;
      stageShared.value = nextStage;
      setStage(nextStage);
      customHandler?.();
      callbacksRef.current.onStageChange?.(nextStage, prev, callbacksRef.current.context);
    },
    [stageShared],
  );

  // Reset Pipeline
  const reset = useCallback(
    (atPosition?: { x?: number; y?: number; rotation?: number; scale?: number; opacity?: number }) => {
      cancelAnimation(progress);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(rotateDeg);
      cancelAnimation(scale);
      cancelAnimation(opacity);

      progress.value = 0;
      translateX.value = atPosition?.x ?? 0;
      translateY.value = atPosition?.y ?? 0;
      rotateDeg.value = atPosition?.rotation ?? 0;
      scale.value = atPosition?.scale ?? 1;
      opacity.value = atPosition?.opacity ?? 1;

      stageRef.current = 'idle' as TStage;
      stageShared.value = 'idle';
      setStage('idle' as TStage);
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      queueRef.current = [];
      setQueue([]);
    },
    [opacity, progress, rotateDeg, scale, stageShared, translateX, translateY],
  );

  // Forward ref for queue processing
  const processNextInQueueRef = useRef<() => void>(() => {});

  // Active in-flight JS callbacks ref (never passed across worklet bridge)
  const activeCallbacksRef = useRef<ActiveFlightCallbacks>({
    targetX: 0,
    targetY: 0,
    targetRot: 0,
  });

  // Flight Completion Handler (runs strictly on JS thread)
  const onFlightSettledJS = useCallback(() => {
    const { targetX, targetY, targetRot, onSettled } = activeCallbacksRef.current;
    translateX.value = targetX;
    translateY.value = targetY;
    rotateDeg.value = targetRot;
    scale.value = 1;

    stageShared.value = 'settled';
    dispatchStageChange('settled' as TStage, 'landing' as TStage);
    onSettled?.();
    dispatchComplete();

    // Check if queue has next item to process
    processNextInQueueRef.current();
  }, [dispatchComplete, dispatchStageChange, rotateDeg, scale, stageShared, translateX, translateY]);

  // Flight Landing Handler (runs strictly on JS thread)
  const onFlightLandingJS = useCallback(() => {
    stageShared.value = 'landing';
    dispatchStageChange('landing' as TStage, 'flight' as TStage);
    activeCallbacksRef.current.onLanding?.();

    if (callbacksRef.current.isReducedMotion) {
      onFlightSettledJS();
      return;
    }

    // Landing micro-spring bounce
    scale.value = 1.05;
    const springConf = activeCallbacksRef.current.landingSpringConfig ?? kinetics.spring.snap;
    scale.value = withSpring(1, springConf, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(onFlightSettledJS)();
      }
    });
  }, [dispatchStageChange, onFlightSettledJS, scale, stageShared]);

  // Ballistic Flight Transition
  const transitionToFlight = useCallback(
    (flightOpts: TransitionFlightOptions) => {
      const {
        from,
        to,
        fromRotation,
        targetRotation = 0,
        initialVelocity,
        durationMs = callbacksRef.current.flightDuration,
        liftHeight: customLift = callbacksRef.current.liftHeight,
        peakScale: customPeak = callbacksRef.current.peakScale,
        landingSpringConfig,
        onLanding: onLandingCb,
        onSettled: onSettledCb,
      } = flightOpts;

      activeCallbacksRef.current = {
        targetX: to.x,
        targetY: to.y,
        targetRot: targetRotation,
        landingSpringConfig,
        onLanding: onLandingCb,
        onSettled: onSettledCb,
      };

      isTransitioningRef.current = true;
      setIsTransitioning(true);
      const prevStage = stageRef.current;
      stageRef.current = 'flight' as TStage;
      stageShared.value = 'flight';
      dispatchStageChange('flight' as TStage, prevStage);

      // Continuous coordinate handoff from current shared values
      const startX = from?.x ?? translateX.value;
      const startY = from?.y ?? translateY.value;
      const startRot = fromRotation ?? rotateDeg.value;

      fromXShared.value = startX;
      fromYShared.value = startY;
      fromRotShared.value = startRot;
      toXShared.value = to.x;
      toYShared.value = to.y;
      targetRotShared.value = targetRotation;
      liftShared.value = customLift;
      peakScaleShared.value = customPeak;

      progress.value = 0;

      if (callbacksRef.current.isReducedMotion) {
        progress.value = 1;
        onFlightLandingJS();
        return;
      }

      // Adjust duration slightly if high initial velocity is passed
      let effectiveDuration = durationMs;
      if (initialVelocity) {
        const speed = Math.hypot(initialVelocity.vx, initialVelocity.vy);
        if (speed > 1000) {
          effectiveDuration = Math.max(220, durationMs * 0.85);
        }
      }

      progress.value = withTiming(
        1,
        {
          duration: effectiveDuration,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(onFlightLandingJS)();
          }
        },
      );
    },
    [
      dispatchStageChange,
      fromRotShared,
      fromXShared,
      fromYShared,
      liftShared,
      onFlightLandingJS,
      peakScaleShared,
      progress,
      rotateDeg,
      stageShared,
      targetRotShared,
      toXShared,
      toYShared,
      translateX,
      translateY,
    ],
  );

  // Queue Management
  const transitionToFlightRef = useRef(transitionToFlight);
  useEffect(() => {
    transitionToFlightRef.current = transitionToFlight;
  }, [transitionToFlight]);

  const processNextInQueue = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const nextItem = queueRef.current.shift()!;
    setQueue([...queueRef.current]);
    if (nextItem.context !== undefined) {
      setContext(nextItem.context);
    }
    transitionToFlightRef.current(nextItem.options);
  }, []);

  useEffect(() => {
    processNextInQueueRef.current = processNextInQueue;
  }, [processNextInQueue]);

  const enqueue = useCallback(
    (item: QueueItem<TContext>) => {
      const options = item.options ?? (item as unknown as TransitionFlightOptions);
      if (!isTransitioningRef.current && stageRef.current !== 'flight') {
        if (item.context !== undefined) {
          setContext(item.context);
        }
        transitionToFlight(options);
      } else {
        queueRef.current.push({ ...item, options });
        setQueue([...queueRef.current]);
      }
    },
    [transitionToFlight],
  );

  const enqueueBatch = useCallback(
    (items: QueueItem<TContext>[]) => {
      if (items.length === 0) return;
      const normalized = items.map((it) => ({
        ...it,
        options: it.options ?? (it as unknown as TransitionFlightOptions),
      }));
      if (!isTransitioningRef.current && stageRef.current !== 'flight') {
        const [first, ...rest] = normalized;
        if (first.context !== undefined) {
          setContext(first.context);
        }
        if (rest.length > 0) {
          queueRef.current.push(...rest);
          setQueue([...queueRef.current]);
        }
        transitionToFlight(first.options);
      } else {
        queueRef.current.push(...normalized);
        setQueue([...queueRef.current]);
      }
    },
    [transitionToFlight],
  );

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setQueue([]);
  }, []);

  return useMemo(
    () => ({
      stage,
      stageShared,
      isTransitioning,
      context,
      setContext,
      translateX,
      translateY,
      rotateDeg,
      scale,
      opacity,
      progress,
      animatedStyle,
      updatePosition,
      transitionToFlight,
      transitionTo,
      reset,
      queueLength: queue.length,
      enqueue,
      enqueueBatch,
      clearQueue,
    }),
    [
      stage,
      stageShared,
      isTransitioning,
      context,
      translateX,
      translateY,
      rotateDeg,
      scale,
      opacity,
      progress,
      animatedStyle,
      updatePosition,
      transitionToFlight,
      transitionTo,
      reset,
      queue.length,
      enqueue,
      enqueueBatch,
      clearQueue,
    ],
  );
}

