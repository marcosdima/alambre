import { useRef, useCallback, useEffect } from 'react';

export interface UseContinuousPressOptions {
  onPress: () => void;
  delay?: number;
  interval?: number;
  intervalMultiplier?: number;
}

export function useContinuousPress({
  onPress,
  delay = 500,
  interval = 100,
  intervalMultiplier = 1,
}: UseContinuousPressOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentInterval = useRef(interval);

  const savedOnPress = useRef(onPress);
  useEffect(() => {
    savedOnPress.current = onPress;
  }, [onPress]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearTimeout(intervalRef.current);
  }, []);

  const startInterval = useCallback(() => {
    savedOnPress.current();
    currentInterval.current = Math.max(10, currentInterval.current * intervalMultiplier);
    intervalRef.current = setTimeout(startInterval, currentInterval.current);
  }, [intervalMultiplier]);

  const onPressIn = useCallback(() => {
    savedOnPress.current(); // initial press
    currentInterval.current = interval;
    timeoutRef.current = setTimeout(() => {
      startInterval();
    }, delay);
  }, [delay, interval, startInterval]);

  const onPressOut = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  return {
    onPressIn,
    onPressOut,
  };
}
