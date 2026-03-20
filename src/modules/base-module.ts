type Listener<TState> = (nextState: TState) => void;

export default class BaseModule<TState> {
  // Keep state private and mutable only through controlled methods.
  private state: TState;

  // Track all subscribers that react to state changes.
  private readonly listeners: Set<Listener<TState>> = new Set();

  constructor(initialState: TState) {
    this.state = initialState;
  }

  getState(): TState {
    return this.state;
  }

  subscribe(listener: Listener<TState>): () => void {
    // Register subscriber and return an unsubscribe function.
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected setState(nextState: TState | ((prevState: TState) => TState)) {
    // Support direct values and updater functions.
    this.state = typeof nextState === 'function'
      ? (nextState as (prevState: TState) => TState)(this.state)
      : nextState;

    // Notify every subscriber with the latest state snapshot.
    this.listeners.forEach((listener) => listener(this.state));
  }

  async init(): Promise<void> {
    // Allow subclasses to override async initialization logic.
    return Promise.resolve();
  }

  dispose(): void {
    // Release subscribers to avoid leaks when provider unmounts.
    this.listeners.clear();
  }
}
