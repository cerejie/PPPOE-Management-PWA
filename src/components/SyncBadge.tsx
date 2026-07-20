import type { EntityWriteState } from '@/lib/sync';

interface Props {
  /** Undefined when the row has no queued write — nothing is rendered. */
  state: EntityWriteState | undefined;
}

/**
 * Marks a row the server has not accepted yet.
 *
 * 'rejected' rows stay visible on purpose: an operator who added a client
 * offline should not have it silently disappear days later. The Sync screen
 * carries the reason and the retry/discard actions.
 */
export function SyncBadge({ state }: Props) {
  if (!state) return null;

  const rejected = state.status === 'failed';

  return (
    <span
      title={state.error ?? undefined}
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        rejected ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'
      }`}
    >
      {rejected ? 'rejected' : 'not synced'}
    </span>
  );
}
