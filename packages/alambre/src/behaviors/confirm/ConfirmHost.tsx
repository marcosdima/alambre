import type { ProviderProps } from './confirm-types';
import { useConfirm } from './use-confirm';

export const ConfirmHost = ({
  children,
  ConfirmComponent,
}: ProviderProps) => {
  const { current, settle } = useConfirm();

  return (
    <>
      {children}
      {current ? (
        <ConfirmComponent
          confirm={current.data}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      ) : null}
    </>
  );
};

export default ConfirmHost;
