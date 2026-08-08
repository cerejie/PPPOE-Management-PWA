import { Link } from 'react-router-dom';
import * as styles from '@/styles/pages/dashboard/cards/StatCard.css';

/** Semantic colouring of the number, matching the tone used elsewhere for the same state. */
export type StatTone = 'ok' | 'muted' | 'warn' | 'danger';

interface Props {
  label: string;
  value: number;
  tone: StatTone;
  /** Clients screen pre-filtered to the same set this number counts. */
  to: string;
}

/** One tappable number on the dashboard grid. */
export function StatCard({ label, value, tone, to }: Props) {
  return (
    <Link to={to} className={styles.card}>
      <span aria-hidden className={styles.dot[tone]} />
      <p className={styles.value[tone]}>{value}</p>
      <p className={styles.label}>{label}</p>
    </Link>
  );
}
