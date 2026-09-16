import { useContext } from 'react';
import context from './confirm-context';

export default () => {
  const ctx = useContext(context);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};
