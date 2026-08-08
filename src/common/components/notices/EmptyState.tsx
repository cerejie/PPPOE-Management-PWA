import * as styles from '@/styles/common/notices/EmptyState.css';

interface Props {
  /** Emoji shown above the title — decorative only. */
  icon: string;
  title: string;
  message: string;
}

/** The "nothing here" card every list screen falls back to. */
export function EmptyState({ icon, title, message }: Props) {
  return (
    <div className={styles.card}>
      <p aria-hidden className={styles.icon}>
        {icon}
      </p>
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
