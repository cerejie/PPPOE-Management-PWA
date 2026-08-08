import { SyncBadge } from '@/common/components/badges/SyncBadge';
import * as styles from '@/styles/pages/pppoe/lists/PppoeAccountRow.css';
import { NO_CLIENT_LABEL } from '@/constants/pppoe/PppoeAccounts.constants';
import type { EntityWriteState } from '@/api/sync/syncEngine';
import type { PppoeAccount } from '@/types/pppoe/Pppoe.types';

interface Props {
  account: PppoeAccount;
  /** Name of the client on this line, or undefined when nobody is. */
  holderName: string | undefined;
  /** Null for anyone who may not edit accounts — the row is then inert. */
  onEdit: (() => void) | null;
  syncState: EntityWriteState | undefined;
}

export function PppoeAccountRow({ account, holderName, onEdit, syncState }: Props) {
  const body = (
    <>
      <div className={styles.header}>
        <div className={styles.identity}>
          <p className={styles.name}>{account.name}</p>
          <p className={holderName ? styles.holder : styles.holderEmpty}>
            {holderName ?? NO_CLIENT_LABEL}
          </p>
        </div>
        <span className={account.disabled ? styles.state.disabled : styles.state.enabled}>
          {account.disabled ? 'Disabled' : 'Enabled'}
        </span>
      </div>

      <div className={styles.tags}>
        <SyncBadge state={syncState} />
        <span className={styles.tag.neutral}>{account.service}</span>
        {!account.present_on_router && (
          // Two very different situations, and an operator needs to tell them
          // apart: one is waiting on us, the other on the router.
          <span className={account.synced_to_router ? styles.tag.danger : styles.tag.warn}>
            {account.synced_to_router ? 'Not on router' : 'Pending on router'}
          </span>
        )}
        {account.router_error && (
          <span title={account.router_error} className={styles.tag.danger}>
            Router error
          </span>
        )}
        {/* The comment is not shown: it is the holder's name, which is already
            the second line of the identity block. */}
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
