import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import * as styles from '@/common/components/inputs/SearchSelect.css';

export interface SearchSelectOption {
  value: string;
  label: string;
  /** Secondary text shown under the label and included in the search. */
  hint?: string;
}

interface SearchSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SearchSelectOption[];
  placeholder?: string;
  emptyMessage?: string;
  autoFocus?: boolean;
}

/** Open/query/highlight for one picker. Two on a form must not share it. */
interface SearchSelectUiState {
  open: boolean;
  query: string;
  activeIndex: number;
}

function matches(option: SearchSelectOption, query: string): boolean {
  const haystack = `${option.label} ${option.hint ?? ''}`.toLowerCase();
  // Every word must appear somewhere, so "cer 401" finds "Cer Ejie — 401-ROOM".
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/**
 * Type-to-filter picker used where a native <select> would mean scrolling a
 * long list. Shows the selected label when closed and turns into a search box
 * on focus, recommending matches as the operator types.
 */
export function SearchSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Search…',
  emptyMessage = 'No matches.',
  autoFocus,
}: SearchSelectProps) {
  const ui = useInstanceStore<SearchSelectUiState>(() => ({
    open: false,
    query: '',
    activeIndex: 0,
  }));
  const { open, query, activeIndex } = useStore(
    ui,
    useShallow((s) => s),
  );
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const results = useMemo(
    () => (query.trim() === '' ? options : options.filter((o) => matches(o, query))),
    [options, query],
  );

  // Keep the highlight on a row that still exists as the query narrows.
  useEffect(() => {
    ui.setState({ activeIndex: 0 });
  }, [query, ui]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function commit(option: SearchSelectOption) {
    onChange(option.value);
    ui.setState({ query: '', open: false });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        ui.setState({ open: true });
        return;
      }
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      ui.setState((s) => ({
        activeIndex: Math.min(results.length - 1, Math.max(0, s.activeIndex + delta)),
      }));
      return;
    }
    if (e.key === 'Enter' && open) {
      const option = results[activeIndex];
      if (option) {
        // Selecting must not submit the form the picker sits in.
        e.preventDefault();
        commit(option);
      }
      return;
    }
    if (e.key === 'Escape' && open) {
      // Stay in the sheet — only close the list.
      e.stopPropagation();
      ui.setState({ query: '', open: false });
    }
  }

  const listId = `${id}-listbox`;

  return (
    <div className={styles.root}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && results[activeIndex] ? `${id}-opt-${activeIndex}` : undefined
        }
        autoComplete="off"
        autoFocus={autoFocus}
        value={open ? query : (selected?.label ?? '')}
        placeholder={selected ? selected.label : placeholder}
        onChange={(e) => ui.setState({ query: e.target.value, open: true })}
        onFocus={() => ui.setState({ open: true })}
        onBlur={() => ui.setState({ query: '', open: false })}
        onKeyDown={handleKeyDown}
        className={styles.field}
      />

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={styles.chevron}
      >
        {open ? <path d="M6 15l6-6 6 6" /> : <path d="M6 9l6 6 6-6" />}
      </svg>

      {open && (
        <ul
          id={listId}
          role="listbox"
          ref={listRef}
          // The sheet closes on a downward drag; scrolling this list must not
          // reach that handler.
          onPointerDown={(e) => e.stopPropagation()}
          className={styles.list}
        >
          {results.length === 0 && <li className={styles.empty}>{emptyMessage}</li>}

          {results.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-opt-${index}`}
              role="option"
              aria-selected={option.value === value}
              data-active={index === activeIndex}
              // Keep focus in the input so blur does not close the list first.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(option)}
              onMouseEnter={() => ui.setState({ activeIndex: index })}
              className={index === activeIndex ? styles.option.active : styles.option.idle}
            >
              <span className={styles.optionLabel}>{option.label}</span>
              {option.hint && <span className={styles.optionHint}>{option.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
