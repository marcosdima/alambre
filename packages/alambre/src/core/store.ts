export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (updater: T | ((prev: T) => T)) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state = typeof updater === 'function' ? (updater as any)(state) : updater;
      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
