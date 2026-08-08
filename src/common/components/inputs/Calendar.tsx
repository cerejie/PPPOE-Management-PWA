import { useEffect } from 'react';
import { useStore } from 'zustand';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { toDateInputValue, todayInputValue } from '@/common/utils/Format.utils';
import * as styles from '@/styles/common/inputs/Calendar.css';

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

/** Which month the grid is showing — per instance, not shared between fields. */
interface CalendarViewState {
  view: Date;
}

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

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Month grid used by DateField. Speaks the same `YYYY-MM-DD` strings as the
 * rest of the app so it drops in wherever an <input type="date"> was, and is
 * themed with our tokens instead of the browser's native popup.
 */
export function Calendar({ value, onSelect, onClear, min, max }: CalendarProps) {
  const today = todayInputValue();

  const viewStore = useInstanceStore<CalendarViewState>(() => ({
    view: startOfMonth(parseDay(value) ?? parseDay(today) ?? new Date()),
  }));
  const view = useStore(viewStore, (s) => s.view);

  // Follow the value when it is changed from outside (e.g. the Today shortcut).
  useEffect(() => {
    const picked = parseDay(value);
    if (picked) viewStore.setState({ view: startOfMonth(picked) });
  }, [value, viewStore]);

  const gridStart = new Date(view.getFullYear(), view.getMonth(), 1 - view.getDay());
  const days = Array.from({ length: CELLS }, (_, i) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i,
    );
    const iso = toDateInputValue(date.toISOString());
    return {
      iso,
      day: date.getDate(),
      inMonth: date.getMonth() === view.getMonth(),
      // ISO day strings sort lexicographically, so plain comparison is enough.
      disabled: (min !== undefined && iso < min) || (max !== undefined && iso > max),
    };
  });

  const prevDisabled =
    min !== undefined && toDateInputValue(addMonths(view, 0).toISOString()) <= min;
  const nextDisabled =
    max !== undefined && toDateInputValue(addMonths(view, 1).toISOString()) > max;

  const shiftMonth = (delta: number) =>
    viewStore.setState((s) => ({ view: addMonths(s.view, delta) }));

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.monthLabel}>{monthLabel(view)}</span>
        <div className={styles.navGroup}>
          <button
            type="button"
            aria-label="Previous month"
            disabled={prevDisabled}
            onClick={() => shiftMonth(-1)}
            className={styles.navButton}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.navIcon}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={nextDisabled}
            onClick={() => shiftMonth(1)}
            className={styles.navButton}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.navIcon}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.weekday}>
            {w}
          </div>
        ))}

        {days.map(({ iso, day, inMonth, disabled }) => {
          const isSelected = iso === value;
          const isToday = iso === today;
          const tone = isSelected
            ? styles.day.selected
            : isToday
              ? styles.day.today
              : inMonth
                ? styles.day.inMonth
                : styles.day.outsideMonth;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              onClick={() => onSelect(iso)}
              className={tone}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onClear} className={styles.clearButton}>
          Clear
        </button>
        <button
          type="button"
          disabled={(min !== undefined && today < min) || (max !== undefined && today > max)}
          onClick={() => onSelect(today)}
          className={styles.todayButton}
        >
          Today
        </button>
      </div>
    </div>
  );
}
