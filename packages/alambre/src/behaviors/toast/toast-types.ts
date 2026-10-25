import type { ReactNode } from 'react';
import type { DefaultReact } from '../../types';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger' | 'error';
export type ToastPosition = 'top' | 'bottom';

export type ToastAction = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'danger' | ToastTone;
};

export type StandardToastPayload = {
  content?: string;
  title?: string;
  tone?: ToastTone;
  position?: ToastPosition;
};

export type ToastPayload = string | StandardToastPayload;

export const parseToastPayload = (raw: unknown): StandardToastPayload => {
  if (typeof raw === 'string') {
    return { content: raw, tone: 'info', position: 'top' };
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const rawTone = obj.tone as string | undefined;
    const tone: ToastTone =
      rawTone === 'error' || rawTone === 'danger'
        ? 'danger'
        : rawTone === 'success'
          ? 'success'
          : rawTone === 'warning'
            ? 'warning'
            : 'info';

    return {
      content: typeof obj.content === 'string' ? obj.content : '',
      title: typeof obj.title === 'string' ? obj.title : undefined,
      tone,
      position: (obj.position as ToastPosition) ?? 'top',
    };
  }
  return { content: '', tone: 'info', position: 'top' };
};

export type RegisterToast<TPayload = ToastPayload> = {
  id?: string;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  payload?: TPayload;
};

export type Toast<TPayload = ToastPayload> = {
  data: RegisterToast<TPayload>;
  startedAt: Date;
};

export type ToastHelperOptions = Omit<RegisterToast, 'payload'> & {
  title?: string;
  position?: ToastPosition;
};

export type ToastHelperFn = (
  contentOrPayload: string | StandardToastPayload,
  options?: ToastHelperOptions,
) => void;

export type UseToastType<TPayload = ToastPayload> = {
  next: () => RegisterToast<TPayload> | undefined;
  show: (message: RegisterToast<TPayload>) => void;
  dismiss: (id?: string) => void;
  clear: () => void;
  setMessage: (message: RegisterToast<TPayload>) => void;
  toast: Toast<TPayload> | null;
  queueLength: number;
  success: ToastHelperFn;
  error: ToastHelperFn;
  warning: ToastHelperFn;
  info: ToastHelperFn;
};

export type ToastComponentProps<TPayload = ToastPayload> = {
  toast: Toast<TPayload>;
  dismiss: UseToastType<TPayload>['dismiss'];
  clear: UseToastType<TPayload>['clear'];
  next: UseToastType<TPayload>['next'];
  queueLength: number;
};

export type ProviderProps<TPayload = ToastPayload> = DefaultReact.ViewProps & {
  delay?: number;
  defaultDuration?: number;
  queueMode?: 'queue' | 'replace';
  ToastComponent: (props: ToastComponentProps<TPayload>) => ReactNode;
};

