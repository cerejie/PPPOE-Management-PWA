import { Link } from 'react-router-dom';
import * as styles from '@/styles/pages/dashboard/widgets/RevenueHero.css';
import { formatMoney, pluralize } from '@/common/utils/Format.utils';

interface Props {
  monthlyRevenue: number;
  totalClients: number;
  connectedCount: number;
  pausedCount: number;
  /** Where the paused pill links; the pill is hidden when nothing is paused. */
  pausedTo: string;
  /** Null for staff, who may not add clients. */
  addClientTo: string | null;
}

/** Top-of-dashboard summary: recurring revenue plus the headline client counts. */
export function RevenueHero({
  monthlyRevenue,
  totalClients,
  connectedCount,
  pausedCount,
  pausedTo,
  addClientTo,
}: Props) {
  return (
    <section className={styles.hero}>
      <div aria-hidden className={styles.blobLight} />
      <div aria-hidden className={styles.blobDark} />

      <div className={styles.headline}>
        <div>
          <p className={styles.caption}>Monthly recurring</p>
          <p className={styles.amount}>{formatMoney(monthlyRevenue)}</p>
        </div>
        {addClientTo && (
          <Link to={addClientTo} aria-label="Add client" className={styles.addButton}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </Link>
        )}
      </div>

      <div className={styles.pills}>
        <span className={styles.pill}>{pluralize(totalClients, 'client')}</span>
        <span className={styles.pill}>{connectedCount} online</span>
        {pausedCount > 0 && (
          <Link to={pausedTo} className={styles.pillLink}>
            {pausedCount} paused
          </Link>
        )}
      </div>
    </section>
  );
}
