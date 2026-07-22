import { useOnline } from '@/hooks/sync/useSyncStatus';

interface OfflineNoticeProps {
  /** Sentence completing "You're offline — …". */
  readonly message?: string;
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
    <p className={`rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn ${className}`}>
      You&apos;re offline — {message}
    </p>
  );
}
