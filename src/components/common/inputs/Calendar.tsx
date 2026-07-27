import { useEffect, useState } from 'react';
import { toDateInputValue, todayInputValue } from '@/utils/common/format';

interface CalendarProps {
  /** Local calendar day, `YYYY-MM-DD`, or '' when nothing is picked yet. */
  value: string;
  onSelect: (value: string) => void;
  onClear: () => void;
  min?: string;
  max?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
/** Six rows always, so the grid never changes height as months are flipped. */
const CELLS = 42;

function parseDay(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/**
 * Month grid used by DateField. Speaks the same `YYYY-MM-DD` strings as the
 * rest of the app so it drops in wherever an <input type="date"> was, and is
 * themed with our tokens instead of the browser's native popup.
 */
export function Calendar({ value, onSelect, onClear, min, max }: CalendarProps) {
  const today = todayInputValue();
  const [view, setView] = useState<Date>(() => {
    const anchor = parseDay(value) ?? parseDay(today) ?? new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  // Follow the value when it is changed from outside (e.g. the Today shortcut).
  useEffect(() => {
    const picked = parseDay(value);
    if (picked) setView(new Date(picked.getFullYear(), picked.getMonth(), 1));
  }, [value]);

  const gridStart = new Date(view.getFullYear(), view.getMonth(), 1 - view.getDay());
  const days = Array.from({ length: CELLS }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const iso = toDateInputValue(date.toISOString());
    return {
      iso,
      day: date.getDate(),
      inMonth: date.getMonth() === view.getMonth(),
      // ISO day strings sort lexicographically, so plain comparison is enough.
      disabled: (min !== undefined && iso < min) || (max !== undefined && iso > max),
    };
  });

  const prevDisabled = min !== undefined && toDateInputValue(addMonths(view, 0).toISOString()) <= min;
  const nextDisabled =
    max !== undefined && toDateInputValue(addMonths(view, 1).toISOString()) > max;

  const navClass =
    'flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent';

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="pl-1 text-sm font-semibold text-fg">{monthLabel(view)}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous month"
            disabled={prevDisabled}
            onClick={() => setView((v) => addMonths(v, -1))}
            className={navClass}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={nextDisabled}
            onClick={() => setView((v) => addMonths(v, 1))}
            className={navClass}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-center text-[11px] font-semibold uppercase text-muted">
            {w}
          </div>
        ))}

        {days.map(({ iso, day, inMonth, disabled }) => {
          const isSelected = iso === value;
          const isToday = iso === today;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              onClick={() => onSelect(iso)}
              className={`flex h-9 items-center justify-center rounded-xl text-sm transition-colors ${
                isSelected
                  ? 'bg-accent-gradient font-semibold text-white shadow-float'
                  : isToday
                    ? 'font-semibold text-accent-text ring-1 ring-accent/60'
                    : inMonth
                      ? 'text-fg hover:bg-surface-2'
                      : 'text-muted/50 hover:bg-surface-2'
              } disabled:pointer-events-none disabled:opacity-25`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg px-2 py-1 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={(min !== undefined && today < min) || (max !== undefined && today > max)}
          onClick={() => onSelect(today)}
          className="rounded-lg px-2 py-1 text-sm font-semibold text-accent-text transition-opacity hover:opacity-70 disabled:opacity-30"
        >
          Today
        </button>
      </div>
    </div>
  );
}
