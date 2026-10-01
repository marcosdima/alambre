import type { ProviderProps } from './confirm-types';
import { useConfirm } from './use-confirm';

export const ConfirmHost = ({
  children,
  ConfirmComponent,
}: ProviderProps) => {
  const { current, settle, dismiss } = useConfirm();

  return (
    <>
      {children}
      {current ? (
        <ConfirmComponent
          confirm={current}
          settle={settle}
          dismiss={dismiss}
        />
      ) : null}
    </>
  );
};

export default ConfirmHost;
