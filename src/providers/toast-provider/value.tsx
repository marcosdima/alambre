import { useCallback, useEffect, useRef, useState } from 'react';
import type { RegisterToast, Toast, UseToastType } from './types';
import { useStack } from 'src/hooks';

export default (delay: number = 0) => {
  const { push, pop, top } = useStack<RegisterToast>();
  const currentMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);

  const next = useCallback(() => {
    const { current } = currentMessageTimer;
    if (!current) return;

    clearTimeout(current);
    currentMessageTimer.current = null;
    setCurrentToast(null);

    return pop();
  }, [pop]);

  useEffect(() => {
    if (!currentMessageTimer.current && !currentToast && top) {
      // Save time out.
      currentMessageTimer.current = setTimeout(next, top.duration + delay);

      // Update current toast.
      setCurrentToast({
        data: top,
        startedAt: new Date(),
      });
    };
  }, [currentToast, delay, next, pop, top]);

  const setMessage = (newToast: RegisterToast) => {
    push(newToast);
  };

  return {
    toast: currentToast,
    setMessage,
    next,
  } as UseToastType;
};
