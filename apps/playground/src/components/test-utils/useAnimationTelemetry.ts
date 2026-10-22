import { useState, useRef, useCallback } from 'react';

export interface UseAnimationTelemetryOptions<TPhase extends string = string> {
  initialPhase: TPhase;
  idlePhase?: TPhase;
  settledPhase?: TPhase;
}

export interface AnimationTelemetryResult<TPhase extends string = string> {
  phase: TPhase;
  elapsedMs: number;
  isRunning: boolean;
  isSettled: boolean;
  startTracking: (runningPhase?: TPhase) => void;
  updatePhase: (nextPhase: TPhase) => void;
  resetTracking: (resetPhase?: TPhase) => void;
}

/**
 * Hook for managing animation phases and timing metrics cleanly across
 * Reanimated worklets (via runOnJS) and React component state.
 */
export function useAnimationTelemetry<TPhase extends string = string>(
  options: UseAnimationTelemetryOptions<TPhase>,
): AnimationTelemetryResult<TPhase> {
  const { initialPhase, idlePhase = initialPhase, settledPhase } = options;
  const [phase, setPhase] = useState<TPhase>(initialPhase);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const startTimeRef = useRef<number>(0);

  const startTracking = useCallback((runningPhase?: TPhase) => {
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    if (runningPhase !== undefined) {
      setPhase(runningPhase);
    }
  }, []);

  const updatePhase = useCallback(
    (nextPhase: TPhase) => {
      if (settledPhase !== undefined && nextPhase === settledPhase && startTimeRef.current > 0) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
      setPhase(nextPhase);
    },
    [settledPhase],
  );

  const resetTracking = useCallback(
    (resetPhase?: TPhase) => {
      startTimeRef.current = 0;
      setElapsedMs(0);
      setPhase(resetPhase ?? idlePhase);
    },
    [idlePhase],
  );

  const isRunning = phase !== idlePhase && (settledPhase === undefined || phase !== settledPhase);
  const isSettled = settledPhase !== undefined ? phase === settledPhase : false;

  return {
    phase,
    elapsedMs,
    isRunning,
    isSettled,
    startTracking,
    updatePhase,
    resetTracking,
  };
}
