import { useEffect, useRef, useState } from 'react';
import { Calendar } from '@/components/common/inputs/Calendar';
import { inputClass } from '@/styles/common/formStyles';
import { formatDate, fromDateInputStart } from '@/utils/common/format';

interface DateFieldProps {
  id: string;
  /** Local calendar day, `YYYY-MM-DD` — the same value an `<input type="date">` speaks. */
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  /** Shown in place of the date while the field is empty. */
  placeholder?: string;
}

/**
 * Date control backed by our own {@link Calendar} rather than the browser's
 * native picker, which cannot be sized, positioned or themed. The trigger reads
 * as a picked value, and opening it — by click or by focus — drops the calendar
 * underneath, centred on the field.
 */
export function DateField({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date…',
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      // Close the calendar without also closing the sheet around it.
      e.stopPropagation();
      setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    // Capture phase, so this runs before the sheet's own Escape handler.
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  const iso = fromDateInputStart(value);

  return (
    <div
      ref={containerRef}
      className="relative mt-1.5"
      // The sheet dismisses on a downward drag; using the calendar must not
      // reach that handler.
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        // The trigger only ever opens; Escape, an outside tap or picking a day
        // closes it. Toggling here would fight the focus-to-open behaviour.
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        className={`${inputClass} flex items-center justify-between gap-3 text-left ${
          open ? 'border-accent bg-surface ring-4 ring-accent/15' : ''
        }`}
      >
        <span className={iso ? 'text-fg' : 'text-muted/70'}>{iso ? formatDate(iso) : placeholder}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
          className="h-5 w-5 shrink-0 text-muted"
        >
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="animate-fade-in absolute left-1/2 z-30 mt-2 w-4/5 -translate-x-1/2 overflow-hidden rounded-3xl border border-line bg-surface shadow-float"
        >
          <Calendar
            value={value}
            min={min}
            max={max}
            onSelect={(next) => {
              onChange(next);
              setOpen(false);
            }}
            onClear={() => {
              onChange('');
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
