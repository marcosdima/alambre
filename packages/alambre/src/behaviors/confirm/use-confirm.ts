import { useExternalStore } from '../../core/use-external-store';
import { defaultConfirmStore } from './confirm-store';
import type { ConfirmStateType } from './confirm-types';

export function useConfirm(): ConfirmStateType {
  const state = useExternalStore(defaultConfirmStore.store, (s) => s);
  return {
    current: state.current,
    ...defaultConfirmStore.actions,
  };
}

export const confirm = defaultConfirmStore.actions.confirm;
export const dismissConfirm = defaultConfirmStore.actions.dismiss;
export default useConfirm;
