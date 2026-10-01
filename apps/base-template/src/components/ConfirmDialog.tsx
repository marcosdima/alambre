import type { ConfirmComponentProps } from 'alambre';
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
      cancelLabel={confirm.cancelLabel ?? 'Cancel'}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
