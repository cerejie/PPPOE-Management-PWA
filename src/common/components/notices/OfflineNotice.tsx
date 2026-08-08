import { useOnline } from '@/hooks/sync/useSyncStatus';
import { notice } from '@/common/components/notices/OfflineNotice.css';

interface OfflineNoticeProps {
  /** Sentence completing "You're offline — …". */
  readonly message?: string;
  /** Extra class for spacing supplied by the surrounding form. */
  readonly className?: string;
}

/**
 * Shown on any form whose write goes through the outbox: offline is a normal
 * state here, not an error, so the form stays usable and only explains what
 * happens next.
 */
export function OfflineNotice({
  message = 'this is queued and synced automatically later.',
  className = '',
}: OfflineNoticeProps) {
  const online = useOnline();
  if (online) return null;

  return (
    <p className={`${notice} ${className}`.trim()}>You&apos;re offline — {message}</p>
  );
}
