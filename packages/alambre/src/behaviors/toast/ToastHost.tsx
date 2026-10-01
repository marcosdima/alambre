import type { ProviderProps } from './toast-types';
import { useToast } from './use-toast';

export const ToastHost = ({
  children,
  ToastComponent,
}: ProviderProps) => {
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
