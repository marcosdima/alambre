import { useSyncExternalStore } from 'react';
import type { Store } from './create-store';

export function useExternalStore<TState, TSelected>(
  store: Store<TState>,
  selector: (state: TState) => TSelected
): TSelected {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState())
  );
}
