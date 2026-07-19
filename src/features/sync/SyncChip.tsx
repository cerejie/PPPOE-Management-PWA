import { useNavigate } from 'react-router-dom';
import { relativeTimeFrom } from '@/lib/format';
import { useSyncStatus } from './useSyncStatus';

/** Persistent header chip: Online / Offline / N pending + last-synced time. */
export function SyncChip() {
  const { online, pendingCount, failedCount, lastSyncedAt } = useSyncStatus();
  const navigate = useNavigate();

  const label = !online
    ? 'Offline'
    : pendingCount > 0
      ? `${pendingCount} pending`
      : 'Online';

  const dotClass = !online
    ? 'bg-slate-400'
    : pendingCount > 0 || failedCount > 0
      ? 'bg-warn'
      : 'bg-ok';

  return (
    <button
      type="button"
      onClick={() => navigate('/sync')}
      className="flex min-h-[44px] items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white active:opacity-70"
      aria-label={`Sync status: ${label}. Synced ${relativeTimeFrom(lastSyncedAt)}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
      <span className="font-medium">{label}</span>
      {failedCount > 0 && (
        <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
          {failedCount} failed
        </span>
      )}
      <span className="text-white/60">· {relativeTimeFrom(lastSyncedAt)}</span>
    </button>
  );
}
