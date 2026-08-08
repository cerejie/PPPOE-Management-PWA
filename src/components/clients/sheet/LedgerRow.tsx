import * as styles from '@/styles/pages/clients/sheet/LedgerSheet.css';
import { LEDGER_KIND_ICON } from '@/constants/clients/ClientLedger.constants';
import { formatDateTime, formatMoney } from '@/common/utils/Format.utils';
import type { LedgerEntry } from '@/hooks/clients/useClientLedger';

interface Props {
  entry: LedgerEntry;
  /** Omitted for anyone who may not delete history. */
  onDelete?: () => void;
}

/** One row of a client's timeline: a payment, a connection change, or a pause. */
export function LedgerRow({ entry, onDelete }: Props) {
  return (
    <li className={styles.row}>
      <span aria-hidden className={styles.kindBadge[entry.kind]}>
        {LEDGER_KIND_ICON[entry.kind]}
      </span>

      <div className={styles.rowBody}>
        <p className={styles.rowTitle}>
          {entry.title}
          {entry.pending && <span className={styles.rowFlag.pending}>pending</span>}
          {entry.failed && <span className={styles.rowFlag.failed}>failed</span>}
        </p>
        <p className={styles.rowDetail}>
          {formatDateTime(entry.at)}
          {entry.detail ? ` · ${entry.detail}` : ''}
        </p>
      </div>

      {entry.amount !== null && (
        <span className={entry.amount < 0 ? styles.rowAmount.negative : styles.rowAmount.positive}>
          {formatMoney(entry.amount)}
        </span>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${entry.title.toLowerCase()} from ${formatDateTime(entry.at)}`}
          className={styles.rowDelete}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M9 7V5h6v2m-8 0l1 13h8l1-13"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </li>
  );
}
