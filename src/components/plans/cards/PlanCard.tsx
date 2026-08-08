import { SyncBadge } from '@/common/components/badges/SyncBadge';
import * as styles from '@/components/plans/cards/PlanCard.css';
import { formatDate, formatMoney, pluralize } from '@/common/utils/Format.utils';
import { isPlanOfferable } from '@/services/plans/Plans.service';
import type { EntityWriteState } from '@/api/sync/syncEngine';
import type { Plan } from '@/types/plans/Plans.types';

interface Props {
  plan: Plan;
  clientCount: number;
  /** Null for anyone who may not edit plans — the card is then inert. */
  onEdit: (() => void) | null;
  syncState: EntityWriteState | undefined;
}

export function PlanCard({ plan, clientCount, onEdit, syncState }: Props) {
  const offerable = isPlanOfferable(plan);

  const body = (
    <>
      <div className={styles.header}>
        <div className={styles.identity}>
          <p className={styles.name}>{plan.name}</p>
          <p className={styles.subscribers}>{pluralize(clientCount, 'client')}</p>
        </div>
        <div className={styles.pricing}>
          <p className={styles.price}>{formatMoney(plan.price)}</p>
          <p className={styles.period}>per {pluralize(plan.duration_days, 'day')}</p>
        </div>
      </div>

      <div className={styles.tags}>
        <SyncBadge state={syncState} />
        <span className={styles.tag.accent}>
          {plan.mbps > 0 ? `${plan.mbps} Mbps` : 'Speed not set'}
        </span>
        <span className={styles.tag.neutral}>{plan.duration_days}-day validity</span>
        {plan.valid_until && (
          <span className={offerable ? styles.tag.warn : styles.tag.danger}>
            {offerable
              ? `Offered until ${formatDate(plan.valid_until)}`
              : `Ended ${formatDate(plan.valid_until)}`}
          </span>
        )}
      </div>
    </>
  );

  if (!onEdit) {
    return <li className={styles.staticCard}>{body}</li>;
  }

  return (
    <li>
      <button type="button" onClick={onEdit} className={styles.editableCard}>
        {body}
      </button>
    </li>
  );
}
