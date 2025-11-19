import type { ColorValue } from 'react-native';
import type { DefaultReact } from '../../types';

export type Type = 'error' | 'info';

export type RegisterToast = {
  content: string;
  type: Type;
  duration: number;
};

export type Toast = {
  data: RegisterToast,
  startedAt: Date,
};

export type UseToastType = {
  next: () => RegisterToast | undefined;
  setMessage: (message: RegisterToast) => void;
  toast: Toast
};

type ToastBodyPalette = {
  backgroundColor?: ColorValue,
  text?: ColorValue,
  type?: Record<Type, ColorValue>,
};

export type ToastBodyProps = {
  palette?: ToastBodyPalette,
  delay?: number,
  animationTime?: number,
};

export type ProviderProps = DefaultReact.ViewProps & {
  bodyProps?: ToastBodyProps,
};
