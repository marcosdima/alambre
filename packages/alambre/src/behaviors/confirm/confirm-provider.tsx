import type { ProviderProps } from './confirm-types';
import Context from './confirm-context';
import value from './confirm-state';

export default ({ children, ConfirmComponent, ...props }: ProviderProps) => {
  const hookValue = value();
  const { current, settle } = hookValue;

  return (
    <Context.Provider {...props} value={hookValue}>
      {
        current
          ? <ConfirmComponent confirm={current.data} onConfirm={() => settle(true)} onCancel={() => settle(false)} />
          : undefined
      }
      {children}
    </Context.Provider>
  );
};
