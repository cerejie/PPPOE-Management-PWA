import { Link } from 'react-router-dom';
import * as styles from '@/components/settings/lists/ManageLink.css';

interface Props {
  to: string;
  label: string;
  hint: string;
}

/** Row that links out to one of the management screens. */
export function ManageLink({ to, label, hint }: Props) {
  return (
    <Link to={to} className={styles.link}>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={styles.hint}>{hint}</span>
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className={styles.chevron}>
        <path
          d="M9 5l7 7-7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
