import type { ProviderProps } from './types';
import Context from './context';
import value from './value';

export default ({
  children,
  delay,
  defaultDuration,
  queueMode,
  ToastComponent,
  ...props
}: ProviderProps) => {
  const hookValue = value(delay, { defaultDuration, queueMode });
  const {
    toast,
    dismiss,
    clear,
    next,
    queueLength,
  } = hookValue;

  return (
    <Context.Provider {...props} value={hookValue}>
      {
        toast
          ? <ToastComponent toast={toast} dismiss={dismiss} clear={clear} next={next} queueLength={queueLength} />
          : undefined
      }
      {children}
    </Context.Provider>
  );
};
