import type { ConfirmComponentProps } from '../..';
import AppDialog from './AppDialog';

export default function ConfirmDialog({
  confirm,
  onConfirm,
  onCancel,
}: ConfirmComponentProps) {
  return (
    <AppDialog
      visible
      onClose={onCancel}
      title={confirm.title}
      description={confirm.message}
      tone={confirm.tone === 'danger' ? 'danger' : 'primary'}
      confirmLabel={confirm.confirmLabel}
      cancelLabel={confirm.cancelLabel ?? 'Cancelar'}
      confirmTone={confirm.tone === 'danger' ? 'danger' : 'primary'}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

