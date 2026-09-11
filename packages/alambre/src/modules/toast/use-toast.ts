import { useContext } from 'react';
import context from './toast-context';

export default () => {
  const ctx = useContext(context);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
