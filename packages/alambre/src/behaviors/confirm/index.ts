export { default as ConfirmHost, ConfirmHost as ConfirmProvider } from './ConfirmHost';
export { default as useConfirm, confirm, dismissConfirm } from './use-confirm';
export { createConfirmStore } from './confirm-store';
export type {
  RegisterConfirm,
  Confirm,
  ConfirmComponentProps,
  ConfirmStateType,
  ProviderProps as ConfirmHostProps,
} from './confirm-types';
