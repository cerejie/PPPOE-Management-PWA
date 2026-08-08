import * as styles from '@/styles/pages/sync/lists/OutboxRow.css';
import { useOutboxSubject } from '@/hooks/sync/useOutboxSubject';
import { describeOutboxItem } from '@/utils/sync/Outbox.utils';
import { formatDateTime } from '@/common/utils/Format.utils';
import type { OutboxItem } from '@/types/sync/Sync.types';

interface Props {
  item: OutboxItem;
  onRetry: () => void;
  onDiscard: () => void;
}

/** One queued write, with the manual controls a rejected row needs. */
export function OutboxRow({ item, onRetry, onDiscard }: Props) {
  const subject = useOutboxSubject(item);
  const failed = item.status === 'failed';

  return (
    <li className={styles.card}>
      <div className={styles.header}>
        <div className={styles.identity}>
          <p className={styles.title}>{describeOutboxItem(item)}</p>
          <p className={styles.subject}>
            {subject} · {formatDateTime(item.created_at)}
          </p>
        </div>
        <span className={failed ? styles.status.failed : styles.status.pending}>{item.status}</span>
      </div>

      {item.error && <p className={styles.error}>{item.error}</p>}

      {failed && (
        <div className={styles.actions}>
          <button type="button" onClick={onRetry} className={styles.action.retry}>
            Retry
          </button>
          <button type="button" onClick={onDiscard} className={styles.action.discard}>
            Discard
          </button>
        </div>
      )}
    </li>
  );
}
