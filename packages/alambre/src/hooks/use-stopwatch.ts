import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseStopwatchOptions {
  autoStart?: boolean;
  initialSeconds?: number;
  intervalMs?: number;
}

export interface UseStopwatchReturn {
  seconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newSeconds?: number) => void;
  formattedTime: string;
}

export const formatStopwatchTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
};

export function useStopwatch(options?: UseStopwatchOptions): UseStopwatchReturn {
  const initial = options?.initialSeconds ?? 0;
  const intervalMs = options?.intervalMs ?? 1000;
  const autoStart = options?.autoStart ?? false;

  const [seconds, setSeconds] = useState(initial);
  const [isRunning, setIsRunning] = useState(autoStart);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, intervalMs]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(
    (newSeconds?: number) => {
      setSeconds(newSeconds ?? initial);
    },
    [initial],
  );

  return {
    seconds,
    isRunning,
    start,
    pause,
    reset,
    formattedTime: formatStopwatchTime(seconds),
  };
}
