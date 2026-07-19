import { useEffect } from 'react';

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="animate-sheet-in relative z-10 w-full max-w-sm rounded-3xl bg-surface p-6 shadow-float">
        <h2 className="text-lg font-bold text-fg">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[48px] flex-1 rounded-2xl bg-surface-2 px-4 py-3 font-semibold text-fg active:opacity-70 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="min-h-[48px] flex-1 rounded-2xl bg-danger px-4 py-3 font-semibold text-white active:opacity-80 disabled:opacity-40"
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
