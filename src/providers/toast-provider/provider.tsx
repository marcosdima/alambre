import type { ProviderProps } from './types';
import Context from './context';
import ToastBody from './toast-body';
import value from './value';

export default ({ children, bodyProps, ...props }: ProviderProps) => {
  const hookValue = value(bodyProps?.delay);
  const { toast } = hookValue;

  return (
    <Context.Provider {...props} value={hookValue}>
      { toast ? <ToastBody {...bodyProps}/> : undefined}
      {children}
    </Context.Provider>
  );
};
