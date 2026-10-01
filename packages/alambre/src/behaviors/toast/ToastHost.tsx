import type { ProviderProps } from './toast-types';
import { defaultToastStore } from './toast-store';
import { useToast } from './use-toast';

export const ToastHost = ({
  children,
  ToastComponent,
  defaultDuration,
  queueMode,
  delay,
}: ProviderProps) => {
  if (defaultDuration !== undefined || queueMode !== undefined || delay !== undefined) {
    defaultToastStore.configure({ defaultDuration, queueMode, delay });
  }

  const { toast, dismiss, clear, next, queueLength } = useToast();

  return (
    <>
      {children}
      {toast ? (
        <ToastComponent
          toast={toast}
          dismiss={dismiss}
          clear={clear}
          next={next}
          queueLength={queueLength}
        />
      ) : null}
    </>
  );
};

export default ToastHost;
