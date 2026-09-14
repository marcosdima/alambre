import type { ReactNode } from 'react';
import type { DefaultReact } from '../../types';

export type ToastAction = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'danger';
};

export type RegisterToast = {
  id?: string;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  payload?: unknown;
};

export type Toast = {
  data: RegisterToast;
  startedAt: Date;
};

export type UseToastType = {
  next: () => RegisterToast | undefined;
  show: (message: RegisterToast) => void;
  dismiss: (id?: string) => void;
  clear: () => void;
  setMessage: (message: RegisterToast) => void;
  toast: Toast | null;
  queueLength: number;
};

export type ToastComponentProps = {
  toast: Toast;
  dismiss: UseToastType['dismiss'];
  clear: UseToastType['clear'];
  next: UseToastType['next'];
  queueLength: number;
};

export type ProviderProps = DefaultReact.ViewProps & {
  delay?: number;
  defaultDuration?: number;
  queueMode?: 'queue' | 'replace';
  ToastComponent: (props: ToastComponentProps) => ReactNode;
};
