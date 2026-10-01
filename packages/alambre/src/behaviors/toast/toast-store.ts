import createStore from '../../core/create-store';
import type { RegisterToast, Toast, UseToastType } from './toast-types';

type ToastState = {
  queue: RegisterToast[];
  currentToast: Toast | null;
};

export type ToastStoreOptions = {
  defaultDuration?: number;
  queueMode?: 'queue' | 'replace';
  delay?: number;
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createToastStore(options: ToastStoreOptions = {}) {
  const {
    defaultDuration = 4000,
    queueMode = 'queue',
    delay = 0,
  } = options;

  const store = createStore<ToastState>({
    queue: [],
    currentToast: null,
  });

  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const processQueue = () => {
    const state = store.getState();
    if (state.currentToast || state.queue.length === 0) return;

    store.setState((prev) => ({
      ...prev,
      currentToast: {
        data: prev.queue[0],
        startedAt: new Date(),
      },
      queue: prev.queue.slice(1),
    }));

    startTimer();
  };

  const startTimer = () => {
    clearTimer();
    const state = store.getState();
    const current = state.currentToast;
    if (!current || current.data.persistent || current.data.actions?.length) return;

    const duration = current.data.duration ?? defaultDuration;
    timer = setTimeout(() => {
      store.setState((prev) => ({ ...prev, currentToast: null }));
      clearTimer();
      processQueue();
    }, duration + delay);
  };

  const normalizeMessage = (message: RegisterToast): RegisterToast => ({
    ...message,
    id: message.id ?? generateId(),
    duration: message.duration ?? defaultDuration,
  });

  const show = (message: RegisterToast) => {
    const normalized = normalizeMessage(message);
    store.setState((prev) => ({
      ...prev,
      queue: queueMode === 'replace' ? [normalized] : [...prev.queue, normalized],
    }));
    processQueue();
  };

  const clear = () => {
    clearTimer();
    store.setState({ queue: [], currentToast: null });
  };

  const dismiss = (id?: string) => {
    const state = store.getState();
    if (id) {
      store.setState((prev) => ({
        ...prev,
        queue: prev.queue.filter((m) => m.id !== id),
      }));
    }

    if (!id || (state.currentToast && state.currentToast.data.id === id)) {
      clearTimer();
      store.setState((prev) => ({ ...prev, currentToast: null }));
      processQueue();
    }
  };

  const next = () => {
    const current = store.getState().currentToast?.data;
    dismiss();
    return current;
  };

  // Wrap into the UseToastType shape for consumers
  const getActions = () => ({
    show,
    dismiss,
    clear,
    setMessage: show,
    next,
  });

  return {
    store,
    actions: getActions(),
  };
}

export const defaultToastStore = createToastStore();
