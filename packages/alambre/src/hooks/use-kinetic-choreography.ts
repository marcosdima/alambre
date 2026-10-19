import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { kinetics } from '../core/kinetics';
import {
  linearTrajectory,
  parabolicTrajectory,
  arcTrajectory,
  type Point2D,
} from '../core/trajectory';
import {
  transferVelocity,
  calculateCriticalDamping,
  type KineticVelocity2D,
  type TransferVelocityOptions,
} from '../core/handoff';

export interface KineticTrackValues {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
  rotateDeg?: number;
  rotateXDeg?: number;
  rotateYDeg?: number;
  opacity?: number;
}

export interface KineticStepTrajectory {
  type?: 'linear' | 'parabolic' | 'arc';
  /** Peak lift in points for parabolic trajectory. @default 50 */
  liftHeight?: number;
  /** Lateral arch curvature for arc trajectory. @default 30 */
  curvature?: number;
  /** Peak scale multiplier at trajectory midpoint. @default 1.1 */
  peakScale?: number;
}

export interface KineticStepOptions {
  id?: string;
  /** Destination property values for this step. */
  to: Partial<KineticTrackValues>;
  /** Animation driver mode: 'spring' or 'timing'. @default 'timing' for trajectories, 'spring' otherwise */
  driver?: 'spring' | 'timing';
  /** Duration in milliseconds when driver is 'timing' or when trajectory is specified. @default 320 */
  duration?: number;
  /** Reanimated easing function for timing driver. @default Easing.bezier(0.22, 1, 0.36, 1) */
  easing?: (t: number) => number;
  /** Spring configuration when driver is 'spring'. @default kinetics.spring.snap */
  springConfig?: WithSpringConfig;
  /** Parametric trajectory config (parabolic lift, arc, etc.). */
  trajectory?: KineticStepTrajectory;
  /** Initial release velocity (e.g. from Gesture.Pan). Transferred to spring momentum. */
  velocity?: KineticVelocity2D;
  /** Optional options for velocity transfer scaling and clamping. */
  velocityOptions?: TransferVelocityOptions;
  /**
   * Whether to enforce critical damping (zeta >= 1.0) on this step,
   * guaranteeing zero overshoot and zero oscillation.
   * @default false
   */
  enforceCriticalDamping?: boolean;
  /** Optional JS callback fired when this step finishes. */
  onStepComplete?: () => void;
}

export interface UseKineticChoreographyOptions {
  /** Initial resting values. */
  initial?: Partial<KineticTrackValues>;
  /** Perspective distance for 3D rotation in points. @default 1000 */
  perspective?: number;
  /** Force reduced motion (instant snaps). */
  forceReducedMotion?: boolean;
  /** Callback fired whenever a step begins or changes. */
  onStepChange?: (stepId: string | number, previousStepId: string | number | null) => void;
  /** Callback fired when the entire sequence or chain completes. */
  onComplete?: () => void;
}

export interface KineticChainBuilder {
  to: (values: Partial<KineticTrackValues>, options?: Omit<KineticStepOptions, 'to'>) => KineticChainBuilder;
  then: (values: Partial<KineticTrackValues>, options?: Omit<KineticStepOptions, 'to'>) => KineticChainBuilder;
  run: () => void;
  clear: () => void;
}

export interface UseKineticChoreographyReturn {
  /** Animated style usable directly on `<Animated.View style={animatedStyle}>`. */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;

  /** Continuous UI-thread shared values across tracks. */
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  rotateDeg: SharedValue<number>;
  rotateXDeg: SharedValue<number>;
  rotateYDeg: SharedValue<number>;
  opacity: SharedValue<number>;
  progress: SharedValue<number>;

  /** Active step index (shared value on UI thread). */
  stepIndex: SharedValue<number>;
  /** Active step id in React state. */
  activeStepId: string | number | null;
  /** Whether a sequence or step is actively animating. */
  isAnimating: boolean;

  /** Update values manually on the UI thread (e.g. during Pan gesture updates). */
  updateManual: (values: Partial<KineticTrackValues>) => void;

  /** Run a single step immediately. */
  transitionTo: (step: KineticStepOptions) => void;

  /** Run a sequence of steps continuously on the UI thread. */
  sequence: (steps: KineticStepOptions[]) => void;

  /** Fluent builder API for chaining steps declaratively. */
  chain: () => KineticChainBuilder;

  /** Instant handoff from gesture release with momentum preservation. */
  handoffGesture: (
    velocity: KineticVelocity2D,
    destination: Partial<KineticTrackValues>,
    options?: Omit<KineticStepOptions, 'to' | 'velocity'>,
  ) => void;

  /** Reset all tracks to initial or specified values. */
  reset: (values?: Partial<KineticTrackValues>) => void;

  /** Cancel any running animations and freeze tracks at current positions. */
  cancel: () => void;
}

class KineticStateHolder {
  queue: KineticStepOptions[] = [];
  currentIndex: number = 0;
  activeStepId: string | number | null = null;
  onStepChange?: (nextId: string | number, prevId: string | number | null) => void;
  onComplete?: () => void;
  isReduced: boolean = false;
  stepRunner?: (step: KineticStepOptions) => void;
}

export function useKineticChoreography(
  options: UseKineticChoreographyOptions = {},
): UseKineticChoreographyReturn {
  const {
    initial = {},
    perspective = 1000,
    forceReducedMotion = false,
    onStepChange,
    onComplete,
  } = options;

  const systemReduced = useReducedMotion();
  const isReduced = forceReducedMotion || Boolean(systemReduced);

  const [activeStepId, setActiveStepId] = useState<string | number | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // UI-thread channel shared values
  const x = useSharedValue<number>(initial.x ?? 0);
  const y = useSharedValue<number>(initial.y ?? 0);
  const scale = useSharedValue<number>(initial.scale ?? 1);
  const rotateDeg = useSharedValue<number>(initial.rotateDeg ?? 0);
  const rotateXDeg = useSharedValue<number>(initial.rotateXDeg ?? 0);
  const rotateYDeg = useSharedValue<number>(initial.rotateYDeg ?? 0);
  const opacity = useSharedValue<number>(initial.opacity ?? 1);

  // Progression & Trajectory Interpolation Shared Values
  const progress = useSharedValue<number>(0);
  const stepIndex = useSharedValue<number>(0);
  const isTrajectoryActive = useSharedValue<boolean>(false);
  const trajectoryType = useSharedValue<number>(0); // 0 = linear, 1 = parabolic, 2 = arc
  const trajFromX = useSharedValue<number>(0);
  const trajFromY = useSharedValue<number>(0);
  const trajToX = useSharedValue<number>(0);
  const trajToY = useSharedValue<number>(0);
  const trajLift = useSharedValue<number>(0);
  const trajCurvature = useSharedValue<number>(0);
  const trajPeakScale = useSharedValue<number>(1);
  const trajBaseScale = useSharedValue<number>(1);
  const remainingTracks = useSharedValue<number>(0);

  // Dedicated class-instance state holder (bypasses plain JS object worklet serialization freeze)
  const state = useMemo(() => new KineticStateHolder(), []);

  useEffect(() => {
    state.onStepChange = onStepChange;
    state.onComplete = onComplete;
    state.isReduced = isReduced;
  }, [onStepChange, onComplete, isReduced, state]);

  // Clean unmount safety
  useEffect(() => {
    return () => {
      cancelAnimation(progress);
      cancelAnimation(x);
      cancelAnimation(y);
      cancelAnimation(scale);
      cancelAnimation(rotateDeg);
      cancelAnimation(rotateXDeg);
      cancelAnimation(rotateYDeg);
      cancelAnimation(opacity);
    };
  }, [opacity, progress, rotateDeg, rotateXDeg, rotateYDeg, scale, x, y]);

  // Unified Multi-Track Animated Style
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    let currentX = x.value;
    let currentY = y.value;
    let currentScale = scale.value;

    if (isTrajectoryActive.value) {
      const t = progress.value;
      const fromPt: Point2D = { x: trajFromX.value, y: trajFromY.value };
      const toPt: Point2D = { x: trajToX.value, y: trajToY.value };

      if (trajectoryType.value === 1) {
        // Parabolic trajectory
        const pt = parabolicTrajectory(t, fromPt, toPt, trajLift.value);
        currentX = pt.x;
        currentY = pt.y;
        const altitude = 4 * t * (1 - t);
        currentScale = trajBaseScale.value + (trajPeakScale.value - 1) * altitude;
      } else if (trajectoryType.value === 2) {
        // Arc trajectory
        const pt = arcTrajectory(t, fromPt, toPt, trajCurvature.value);
        currentX = pt.x;
        currentY = pt.y;
      } else {
        // Linear trajectory
        const pt = linearTrajectory(t, fromPt, toPt);
        currentX = pt.x;
        currentY = pt.y;
      }
    }

    return {
      opacity: opacity.value,
      transform: [
        { perspective },
        { translateX: currentX },
        { translateY: currentY },
        { rotate: `${rotateDeg.value}deg` },
        { rotateX: `${rotateXDeg.value}deg` },
        { rotateY: `${rotateYDeg.value}deg` },
        { scale: currentScale },
      ],
    };
  });

  // Manual track updates (e.g. from Pan gestures on UI thread)
  const updateManual = useCallback(
    (values: Partial<KineticTrackValues>) => {
      'worklet';
      isTrajectoryActive.value = false;
      if (values.x !== undefined) x.value = values.x;
      if (values.y !== undefined) y.value = values.y;
      if (values.scale !== undefined) scale.value = values.scale;
      if (values.rotateDeg !== undefined) rotateDeg.value = values.rotateDeg;
      if (values.rotateXDeg !== undefined) rotateXDeg.value = values.rotateXDeg;
      if (values.rotateYDeg !== undefined) rotateYDeg.value = values.rotateYDeg;
      if (values.opacity !== undefined) opacity.value = values.opacity;
    },
    [isTrajectoryActive, opacity, rotateDeg, rotateXDeg, rotateYDeg, scale, x, y],
  );

  const handleStepDoneJS = useCallback(() => {
    const finishedStep = state.queue[state.currentIndex];
    finishedStep?.onStepComplete?.();

    state.currentIndex += 1;
    stepIndex.value = state.currentIndex;

    if (state.currentIndex >= state.queue.length) {
      state.queue = [];
      state.activeStepId = null;
      setActiveStepId(null);
      setIsAnimating(false);
      state.onComplete?.();
      return;
    }

    const nextStep = state.queue[state.currentIndex];
    const prevId = state.activeStepId;
    const nextId = nextStep.id ?? state.currentIndex;
    state.activeStepId = nextId;
    setActiveStepId(nextId);
    state.onStepChange?.(nextId, prevId);

    state.stepRunner?.(nextStep);
  }, [state, stepIndex]);

  const executeStep = useCallback(
    (step: KineticStepOptions) => {
      const {
        to,
        driver,
        duration = 320,
        easing = Easing.bezier(0.22, 1, 0.36, 1),
        springConfig = kinetics.spring.snap,
        trajectory,
        velocity,
      } = step;

      if (state.isReduced) {
        // Reduced motion: snap directly
        if (to.x !== undefined) x.value = to.x;
        if (to.y !== undefined) y.value = to.y;
        if (to.scale !== undefined) scale.value = to.scale;
        if (to.rotateDeg !== undefined) rotateDeg.value = to.rotateDeg;
        if (to.rotateXDeg !== undefined) rotateXDeg.value = to.rotateXDeg;
        if (to.rotateYDeg !== undefined) rotateYDeg.value = to.rotateYDeg;
        if (to.opacity !== undefined) opacity.value = to.opacity;
        isTrajectoryActive.value = false;
        handleStepDoneJS();
        return;
      }

      // Check if this step is driven by a parametric trajectory
      if (trajectory && (to.x !== undefined || to.y !== undefined)) {
        isTrajectoryActive.value = true;
        trajFromX.value = x.value;
        trajFromY.value = y.value;
        trajToX.value = to.x ?? x.value;
        trajToY.value = to.y ?? y.value;
        trajBaseScale.value = scale.value;

        if (trajectory.type === 'parabolic') {
          trajectoryType.value = 1;
          trajLift.value = trajectory.liftHeight ?? 50;
          trajPeakScale.value = trajectory.peakScale ?? 1.1;
        } else if (trajectory.type === 'arc') {
          trajectoryType.value = 2;
          trajCurvature.value = trajectory.curvature ?? 30;
        } else {
          trajectoryType.value = 0;
        }

        // Secondary tracks (rotations, opacity) run in parallel
        if (to.rotateDeg !== undefined) {
          rotateDeg.value = withTiming(to.rotateDeg, { duration, easing });
        }
        if (to.rotateXDeg !== undefined) {
          rotateXDeg.value = withTiming(to.rotateXDeg, { duration, easing });
        }
        if (to.rotateYDeg !== undefined) {
          rotateYDeg.value = withTiming(to.rotateYDeg, { duration, easing });
        }
        if (to.opacity !== undefined) {
          opacity.value = withTiming(to.opacity, { duration, easing });
        }

        progress.value = 0;
        progress.value = withTiming(1, { duration, easing }, (finished) => {
          'worklet';
          if (finished) {
            // Settle trajectory coordinates directly into base x, y
            x.value = trajToX.value;
            y.value = trajToY.value;
            isTrajectoryActive.value = false;
            runOnJS(handleStepDoneJS)();
          }
        });
        return;
      }

      // Standard multi-track step (spring or timing)
      isTrajectoryActive.value = false;
      const isSpring = driver === 'spring' || velocity !== undefined;
      const baseSpringConfig = springConfig;
      const shouldEnforceCritical =
        step.enforceCriticalDamping ?? step.velocityOptions?.enforceCriticalDamping ?? false;

      let effectiveBaseSpring = baseSpringConfig;
      if (shouldEnforceCritical) {
        const stiffness = baseSpringConfig.stiffness ?? 100;
        const mass = baseSpringConfig.mass ?? 1;
        const criticalDamping = calculateCriticalDamping(stiffness, mass);
        effectiveBaseSpring = {
          ...baseSpringConfig,
          damping: Math.max(baseSpringConfig.damping ?? 10, criticalDamping),
        } as WithSpringConfig;
      }

      const velOptions: TransferVelocityOptions = {
        ...step.velocityOptions,
        ...(shouldEnforceCritical ? { enforceCriticalDamping: true } : {}),
      };

      // Axis-separated velocity transfer for accurate 2D directional physics
      let springConfigX = effectiveBaseSpring;
      let springConfigY = effectiveBaseSpring;

      if (velocity) {
        springConfigX =
          velocity.vx !== undefined
            ? transferVelocity(velocity.vx, effectiveBaseSpring, velOptions)
            : effectiveBaseSpring;
        springConfigY =
          velocity.vy !== undefined
            ? transferVelocity(velocity.vy, effectiveBaseSpring, velOptions)
            : effectiveBaseSpring;
      }

      let activeCount = 0;
      if (to.x !== undefined) activeCount += 1;
      if (to.y !== undefined) activeCount += 1;
      if (to.scale !== undefined) activeCount += 1;
      if (to.rotateDeg !== undefined) activeCount += 1;
      if (to.rotateXDeg !== undefined) activeCount += 1;
      if (to.rotateYDeg !== undefined) activeCount += 1;
      if (to.opacity !== undefined) activeCount += 1;

      if (activeCount === 0) {
        handleStepDoneJS();
        return;
      }

      remainingTracks.value = activeCount;

      const handleTrackFinish = (finished?: boolean) => {
        'worklet';
        if (finished) {
          remainingTracks.value = remainingTracks.value - 1;
          if (remainingTracks.value <= 0) {
            runOnJS(handleStepDoneJS)();
          }
        }
      };

      if (to.x !== undefined) {
        x.value = isSpring
          ? withSpring(to.x, springConfigX, handleTrackFinish)
          : withTiming(to.x, { duration, easing }, handleTrackFinish);
      }

      if (to.y !== undefined) {
        y.value = isSpring
          ? withSpring(to.y, springConfigY, handleTrackFinish)
          : withTiming(to.y, { duration, easing }, handleTrackFinish);
      }

      if (to.scale !== undefined) {
        // Translation velocity (vx, vy in px/s) must never leak into unitless scale (Z-elevation)!
        scale.value = isSpring
          ? withSpring(to.scale, effectiveBaseSpring, handleTrackFinish)
          : withTiming(to.scale, { duration, easing }, handleTrackFinish);
      }

      if (to.rotateDeg !== undefined) {
        rotateDeg.value = isSpring
          ? withSpring(to.rotateDeg, effectiveBaseSpring, handleTrackFinish)
          : withTiming(to.rotateDeg, { duration, easing }, handleTrackFinish);
      }

      if (to.rotateXDeg !== undefined) {
        rotateXDeg.value = isSpring
          ? withSpring(to.rotateXDeg, effectiveBaseSpring, handleTrackFinish)
          : withTiming(to.rotateXDeg, { duration, easing }, handleTrackFinish);
      }

      if (to.rotateYDeg !== undefined) {
        rotateYDeg.value = isSpring
          ? withSpring(to.rotateYDeg, effectiveBaseSpring, handleTrackFinish)
          : withTiming(to.rotateYDeg, { duration, easing }, handleTrackFinish);
      }

      if (to.opacity !== undefined) {
        opacity.value = withTiming(to.opacity, { duration, easing }, handleTrackFinish);
      }
    },
    [
      handleStepDoneJS,
      isTrajectoryActive,
      opacity,
      progress,
      remainingTracks,
      rotateDeg,
      rotateXDeg,
      rotateYDeg,
      scale,
      state.isReduced,
      trajBaseScale,
      trajCurvature,
      trajFromX,
      trajFromY,
      trajLift,
      trajPeakScale,
      trajToX,
      trajToY,
      trajectoryType,
      x,
      y,
    ],
  );

  useEffect(() => {
    state.stepRunner = executeStep;
  }, [executeStep, state]);

  // Execute sequence
  const sequence = useCallback(
    (steps: KineticStepOptions[]) => {
      if (steps.length === 0) return;
      state.queue = [...steps];
      state.currentIndex = 0;
      stepIndex.value = 0;
      setIsAnimating(true);

      const firstStep = steps[0];
      const stepId = firstStep.id ?? 0;
      state.activeStepId = stepId;
      setActiveStepId(stepId);
      state.onStepChange?.(stepId, null);

      executeStep(firstStep);
    },
    [executeStep, state, stepIndex],
  );

  // Transition single step
  const transitionTo = useCallback(
    (step: KineticStepOptions) => {
      sequence([step]);
    },
    [sequence],
  );

  // Gesture handoff
  const handoffGesture = useCallback(
    (
      velocity: KineticVelocity2D,
      destination: Partial<KineticTrackValues>,
      options: Omit<KineticStepOptions, 'to' | 'velocity'> = {},
    ) => {
      transitionTo({
        ...options,
        to: destination,
        driver: 'spring',
        velocity,
      });
    },
    [transitionTo],
  );

  // Cancel
  const cancel = useCallback(() => {
    cancelAnimation(progress);
    cancelAnimation(x);
    cancelAnimation(y);
    cancelAnimation(scale);
    cancelAnimation(rotateDeg);
    cancelAnimation(rotateXDeg);
    cancelAnimation(rotateYDeg);
    cancelAnimation(opacity);

    isTrajectoryActive.value = false;
    remainingTracks.value = 0;
    state.queue = [];
    state.currentIndex = 0;
    state.activeStepId = null;
    setActiveStepId(null);
    setIsAnimating(false);
  }, [isTrajectoryActive, opacity, progress, remainingTracks, rotateDeg, rotateXDeg, rotateYDeg, scale, state, x, y]);

  // Reset
  const reset = useCallback(
    (values: Partial<KineticTrackValues> = {}) => {
      cancel();
      const target = { ...initial, ...values };
      x.value = target.x ?? 0;
      y.value = target.y ?? 0;
      scale.value = target.scale ?? 1;
      rotateDeg.value = target.rotateDeg ?? 0;
      rotateXDeg.value = target.rotateXDeg ?? 0;
      rotateYDeg.value = target.rotateYDeg ?? 0;
      opacity.value = target.opacity ?? 1;
      progress.value = 0;
      stepIndex.value = 0;
    },
    [cancel, initial, opacity, progress, rotateDeg, rotateXDeg, rotateYDeg, scale, stepIndex, x, y],
  );

  // Fluent chain builder
  const chain = useCallback((): KineticChainBuilder => {
    const builderSteps: KineticStepOptions[] = [];

    const builder: KineticChainBuilder = {
      to(values, stepOpts = {}) {
        builderSteps.push({ ...stepOpts, to: values });
        return builder;
      },
      then(values, stepOpts = {}) {
        builderSteps.push({ ...stepOpts, to: values });
        return builder;
      },
      run() {
        sequence(builderSteps);
      },
      clear() {
        builderSteps.length = 0;
      },
    };

    return builder;
  }, [sequence]);

  return useMemo(
    () => ({
      animatedStyle,
      x,
      y,
      scale,
      rotateDeg,
      rotateXDeg,
      rotateYDeg,
      opacity,
      progress,
      stepIndex,
      activeStepId,
      isAnimating,
      updateManual,
      transitionTo,
      sequence,
      chain,
      handoffGesture,
      reset,
      cancel,
    }),
    [
      activeStepId,
      animatedStyle,
      cancel,
      chain,
      handoffGesture,
      isAnimating,
      opacity,
      progress,
      reset,
      rotateDeg,
      rotateXDeg,
      rotateYDeg,
      scale,
      sequence,
      stepIndex,
      transitionTo,
      updateManual,
      x,
      y,
    ],
  );
}
