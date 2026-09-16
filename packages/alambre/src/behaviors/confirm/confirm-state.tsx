import { useCallback, useRef, useState } from 'react';
import type { Confirm, ConfirmStateType, RegisterConfirm } from './confirm-types';

export default (): ConfirmStateType => {
  const [current, setCurrent] = useState<Confirm | null>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setCurrent(null);
    resolve?.(ok);
  }, []);

  const confirm = useCallback((request: RegisterConfirm) => (
    new Promise<boolean>((resolve) => {
      if (resolveRef.current) resolveRef.current(false);
      resolveRef.current = resolve;
      setCurrent({ data: request });
    })
  ), []);

  const dismiss = useCallback(() => {
    settle(false);
  }, [settle]);

  return { confirm, dismiss, current, settle };
};
