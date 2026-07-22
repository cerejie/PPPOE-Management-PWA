import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { inputClass } from '@/styles/common/formStyles';

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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const results = useMemo(
    () => (query.trim() === '' ? options : options.filter((o) => matches(o, query))),
    [options, query],
  );

  // Keep the highlight on a row that still exists as the query narrows.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function commit(option: SearchSelectOption) {
    onChange(option.value);
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => Math.min(results.length - 1, Math.max(0, i + delta)));
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
      setQuery('');
      setOpen(false);
    }
  }

  const listId = `${id}-listbox`;

  return (
    <div className="relative mt-1.5">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[activeIndex] ? `${id}-opt-${activeIndex}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={open ? query : (selected?.label ?? '')}
        placeholder={selected ? selected.label : placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setQuery('');
          setOpen(false);
        }}
        onKeyDown={handleKeyDown}
        className={`${inputClass} pr-11`}
      />

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
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
          className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface py-1.5 shadow-float"
        >
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">{emptyMessage}</li>}

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
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer px-4 py-2.5 text-base ${
                index === activeIndex ? 'bg-accent-soft text-accent-text' : 'text-fg'
              }`}
            >
              <span className="block truncate font-medium">{option.label}</span>
              {option.hint && <span className="block truncate text-xs text-muted">{option.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
