import * as styles from '@/common/components/notices/LoadingNotice.css';

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
