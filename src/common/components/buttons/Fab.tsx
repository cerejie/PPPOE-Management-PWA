import * as styles from '@/styles/common/buttons/Fab.css';

interface FabProps {
  onClick: () => void;
  /** Accessible name, e.g. "Add client". */
  label: string;
}

/** Floating add button. */
export function Fab({ onClick, label }: FabProps) {
  return (
    <div className={styles.anchor}>
      <div className={styles.column}>
        <button type="button" onClick={onClick} aria-label={label} className={styles.button}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
