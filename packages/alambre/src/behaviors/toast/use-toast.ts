import { useExternalStore } from '../../core/use-external-store';
import { defaultToastStore } from './toast-store';
import type { UseToastType } from './toast-types';

export function useToast(): UseToastType {
  const state = useExternalStore(defaultToastStore.store, (s) => s);
  return {
    toast: state.currentToast,
    queueLength: state.queue.length,
    ...defaultToastStore.actions,
  };
}

export const toast = defaultToastStore.actions;
export default useToast;
