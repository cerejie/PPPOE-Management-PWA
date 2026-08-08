import * as styles from '@/styles/common/inputs/SearchInput.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Read out instead of a visible label — the icon carries the meaning. */
  ariaLabel: string;
}

/** The list-filter search box used at the top of the client and room screens. */
export function SearchInput({ value, onChange, placeholder, ariaLabel }: Props) {
  return (
    <div className={styles.root}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className={styles.icon}>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        inputMode="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={styles.input}
      />
    </div>
  );
}
