import * as styles from '@/styles/common/notices/LoadingNotice.css';

interface Props {
  label?: string;
}

/** Shown while a Dexie query has not answered yet. */
export function LoadingNotice({ label = 'Loading…' }: Props) {
  return (
    <p role="status" className={styles.notice}>
      {label}
    </p>
  );
}
