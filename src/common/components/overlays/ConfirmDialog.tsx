import { useEffect } from 'react';
import * as styles from '@/styles/common/overlays/ConfirmDialog.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  /** Label for the destructive action. */
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Themed replacement for window.confirm on destructive actions. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className={styles.root} role="alertdialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className={styles.backdrop}
      />

      <div className={styles.panel}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button type="button" onClick={onCancel} disabled={busy} className={styles.cancel}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={styles.confirm}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
