import { useNavigate } from 'react-router-dom';
import { relativeTimeFrom } from '@/common/utils/Format.utils';
import { useSyncStatus } from '@/hooks/sync/useSyncStatus';
import * as styles from '@/components/sync/widgets/SyncChip.css';

/** Persistent header chip: Online / Offline / N pending + last-synced time. */
export function SyncChip() {
  const { online, pendingCount, failedCount, lastSyncedAt } = useSyncStatus();
  const navigate = useNavigate();

  const label = !online ? 'Offline' : pendingCount > 0 ? `${pendingCount} pending` : 'Online';

  const dot = !online
    ? styles.dot.offline
    : pendingCount > 0 || failedCount > 0
      ? styles.dot.busy
      : styles.dot.synced;

  return (
    <button
      type="button"
      onClick={() => navigate('/sync')}
      className={styles.chip}
      aria-label={`Sync status: ${label}. Synced ${relativeTimeFrom(lastSyncedAt)}`}
    >
      <span className={dot} aria-hidden />
      <span className={styles.label}>{label}</span>
      {failedCount > 0 && <span className={styles.failedCount}>{failedCount}</span>}
    </button>
  );
}
