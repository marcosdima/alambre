import type { ReactNode } from 'react';
import type { DefaultReact } from '../../types';

export type RegisterConfirm = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
};

export type Confirm = {
  data: RegisterConfirm;
  resolve: (ok: boolean) => void;
};

export type UseConfirmType = {
  confirm: (request: RegisterConfirm) => Promise<boolean>;
  dismiss: () => void;
};

export type ConfirmStateType = UseConfirmType & {
  current: Confirm | null;
  settle: (ok: boolean) => void;
};

export type ConfirmComponentProps = {
  confirm: RegisterConfirm;
  onConfirm: () => void;
  onCancel: () => void;
};

export type ProviderProps = DefaultReact.ViewProps & {
  ConfirmComponent: (props: ConfirmComponentProps) => ReactNode;
};
