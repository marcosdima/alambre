import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import type { DefaultReact } from '../../types';

export type Type = 'error' | 'info' | 'warning' | 'success';

export type RegisterToast = {
  id?: string;
  duration?: number;
  persistent?: boolean;
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

export type DefaultToastPayload = {
  title?: string;
  content?: string;
  tone?: Type;
};

type ToastBodyPalette = {
  backgroundColor?: ColorValue;
  text?: ColorValue;
  type?: Partial<Record<Type, ColorValue>>;
};

export type ToastBodyProps = {
  toast: Toast;
  dismiss: UseToastType['dismiss'];
  clear: UseToastType['clear'];
  next: UseToastType['next'];
  queueLength: number;
  palette?: ToastBodyPalette;
  delay?: number;
  animationTime?: number;
  position?: 'top' | 'bottom';
  containerStyle?: StyleProp<ViewStyle>;
};

export type ProviderProps = DefaultReact.ViewProps & {
  delay?: number;
  defaultDuration?: number;
  queueMode?: 'queue' | 'replace';
  ToastComponent: (props: ToastComponentProps) => ReactNode;
};
