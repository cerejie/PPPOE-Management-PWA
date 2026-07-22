import { useEffect, type ReactNode } from 'react';

interface SheetProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet used for every modal flow (payments, room/plan forms).
 * Closes on backdrop tap or Escape, and locks background scroll while open.
 */
export function Sheet({ title, subtitle, onClose, children }: SheetProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div
        className="animate-sheet-in relative z-10 max-h-[92dvh] w-full max-w-app overflow-y-auto rounded-t-4xl border-t border-line bg-surface px-5 pt-3"
        style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-line" aria-hidden />
        <h2 className="text-xl font-bold tracking-tight text-fg">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
