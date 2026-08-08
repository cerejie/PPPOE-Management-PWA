import * as styles from '@/styles/pages/settings/buttons/EditNameButton.css';

interface Props {
  /** Read out in place of the icon, e.g. "Rename Ana Cruz". */
  label: string;
  onClick: () => void;
}

/** Pencil affordance shared by the profile card and each staff row. */
export function EditNameButton({ label, onClick }: Props) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={styles.button}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 20h4l10-10-4-4L4 16v4z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
