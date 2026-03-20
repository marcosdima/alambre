import { useCallback, useEffect, useRef, useState } from 'react';
import type { RegisterToast, Toast, UseToastType } from './types';

type ValueOptions = {
  defaultDuration?: number;
  queueMode?: 'queue' | 'replace';
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default (delay: number = 0, options: ValueOptions = {}) => {
  const {
    defaultDuration = 4000,
    queueMode = 'queue',
  } = options;

  const [queue, setQueue] = useState<RegisterToast[]>([]);
  const currentMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);

  const clearTimer = () => {
    const { current } = currentMessageTimer;
    if (!current) return;
    clearTimeout(current);
    currentMessageTimer.current = null;
  };

  const normalizeMessage = useCallback((message: RegisterToast): RegisterToast => ({
    ...message,
    id: message.id ?? generateId(),
    duration: message.duration ?? defaultDuration,
  }), [defaultDuration]);

  const show = useCallback((message: RegisterToast) => {
    const normalized = normalizeMessage(message);
    setQueue((prev) => (queueMode === 'replace' ? [normalized] : prev.concat(normalized)));
  }, [normalizeMessage, queueMode]);

  const clear = useCallback(() => {
    clearTimer();
    setCurrentToast(null);
    setQueue([]);
  }, []);

  const dismiss = useCallback((id?: string) => {
    if (id) {
      setQueue((prev) => prev.filter((message) => message.id !== id));
    }

    setCurrentToast((current) => {
      if (!current) return current;
      if (id && current.data.id !== id) return current;

      clearTimer();
      return null;
    });
  }, []);

  const next = useCallback(() => {
    const previous = currentToast?.data;
    dismiss();
    return previous;
  }, [currentToast?.data, dismiss]);

  useEffect(() => {
    if (currentToast || queue.length === 0) return;

    setCurrentToast({
      data: queue[0],
      startedAt: new Date(),
    });
    setQueue((prev) => prev.slice(1));
  }, [currentToast, queue]);

  useEffect(() => {
    if (!currentToast || currentToast.data.persistent) return;

    clearTimer();
    const duration = currentToast.data.duration ?? defaultDuration;
    currentMessageTimer.current = setTimeout(() => {
      setCurrentToast(null);
      clearTimer();
    }, duration + delay);

    return clearTimer;
  }, [currentToast, defaultDuration, delay]);

  useEffect(() => {
    return clearTimer;
  }, []);

  const setMessage = (newToast: RegisterToast) => {
    show(newToast);
  };

  return {
    toast: currentToast,
    queueLength: queue.length,
    show,
    dismiss,
    clear,
    setMessage,
    next,
  } as UseToastType;
};
