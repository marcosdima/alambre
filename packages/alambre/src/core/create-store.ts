export type StoreListener<TState> = (nextState: TState) => void;

export type Store<TState> = {
  getState: () => TState;
  setState: (nextState: TState | ((prevState: TState) => TState)) => void;
  subscribe: (listener: StoreListener<TState>) => () => void;
  dispose: () => void;
  get: () => TState;
  set: (nextState: TState | ((prevState: TState) => TState)) => void;
};

export default function createStore<TState>(initialState: TState): Store<TState> {
  let state = initialState;
  const listeners = new Set<StoreListener<TState>>();

  const getState = () => state;

  const setState = (nextState: TState | ((prevState: TState) => TState)) => {
    state = typeof nextState === 'function'
      ? (nextState as (prevState: TState) => TState)(state)
      : nextState;

    listeners.forEach((listener) => listener(state));
  };

  return {
    getState,
    setState,
    get: getState,
    set: setState,

    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    dispose: () => {
      listeners.clear();
    },
  };
}
