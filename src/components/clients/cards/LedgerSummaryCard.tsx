import * as styles from '@/components/clients/cards/LedgerSummaryCard.css';
import { formatDateTime, formatDuration, formatMoney, pluralize } from '@/common/utils/Format.utils';
import type { Ledger } from '@/hooks/clients/useClientLedger';

interface Props {
  /** Undefined until Dexie answers. */
  ledger: Ledger | undefined;
  onOpen: () => void;
}

function describeTotals(ledger: Ledger): string {
  const credited =
    ledger.totalCredited > 0 ? ` · ${formatDuration(ledger.totalCredited)} credited` : '';
  return `${formatMoney(ledger.totalPaid)} paid${credited}`;
}

/** Opens the full timeline of payments, connection events and pauses. */
export function LedgerSummaryCard({ ledger, onOpen }: Props) {
  const latestEntry = ledger?.entries[0];

  return (
    <button type="button" onClick={onOpen} className={styles.button}>
      <div className={styles.text}>
        <p className={styles.title}>
          {ledger ? pluralize(ledger.entries.length, 'entry', 'entries') : 'Loading…'}
        </p>
        <p className={styles.summary}>
          {ledger ? describeTotals(ledger) : 'Payments, connection events and pauses'}
        </p>
      </div>

      {latestEntry && <span className={styles.latest}>{formatDateTime(latestEntry.at)}</span>}

      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className={styles.chevron}>
        <path
          d="M9 5l7 7-7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
