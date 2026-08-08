import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { Calendar } from '@/common/components/inputs/Calendar';
import { formatDate, fromDateInputStart } from '@/common/utils/Format.utils';
import * as styles from '@/common/components/inputs/DateField.css';

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

/** Whether this field's calendar is showing — per instance, not shared. */
interface DateFieldUiState {
  open: boolean;
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
  const ui = useInstanceStore<DateFieldUiState>(() => ({ open: false }));
  const open = useStore(ui, (s) => s.open);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) ui.setState({ open: false });
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      // Close the calendar without also closing the sheet around it.
      e.stopPropagation();
      ui.setState({ open: false });
    }

    document.addEventListener('pointerdown', onPointerDown);
    // Capture phase, so this runs before the sheet's own Escape handler.
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, ui]);

  const iso = fromDateInputStart(value);

  return (
    <div
      ref={containerRef}
      className={styles.root}
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
        onClick={() => ui.setState({ open: true })}
        onFocus={() => ui.setState({ open: true })}
        className={open ? `${styles.trigger} ${styles.triggerOpen}` : styles.trigger}
      >
        <span className={iso ? styles.valueText : styles.placeholderText}>
          {iso ? formatDate(iso) : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
          className={styles.icon}
        >
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>

      {open && (
        <div role="dialog" aria-label="Choose a date" className={styles.popover}>
          <Calendar
            value={value}
            min={min}
            max={max}
            onSelect={(next) => {
              onChange(next);
              ui.setState({ open: false });
            }}
            onClear={() => {
              onChange('');
              ui.setState({ open: false });
            }}
          />
        </div>
      )}
    </div>
  );
}
