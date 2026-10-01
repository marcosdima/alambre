import createStore from '../../core/create-store';
import type { Confirm, RegisterConfirm } from './confirm-types';

type ConfirmState = {
  current: Confirm | null;
};

export function createConfirmStore() {
  const store = createStore<ConfirmState>({ current: null });
  let resolveRef: ((ok: boolean) => void) | null = null;

  const settle = (ok: boolean) => {
    const resolve = resolveRef;
    resolveRef = null;
    store.setState({ current: null });
    resolve?.(ok);
  };

  const confirm = (request: RegisterConfirm): Promise<boolean> => {
    return new Promise((resolve) => {
      if (resolveRef) resolveRef(false);
      resolveRef = resolve;
      store.setState({ current: { data: request } });
    });
  };

  const dismiss = () => {
    settle(false);
  };

  const getActions = () => ({
    confirm,
    dismiss,
    settle,
  });

  return { store, actions: getActions() };
}

export const defaultConfirmStore = createConfirmStore();
