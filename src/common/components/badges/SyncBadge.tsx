import type { EntityWriteState } from '@/api/sync/syncEngine';
import { pill } from '@/styles/global/Badge.css';

interface Props {
  /** Undefined when the row has no queued write — nothing is rendered. */
  state: EntityWriteState | undefined;
}

/**
 * Marks a row the server has not accepted yet.
 *
 * 'rejected' rows stay visible on purpose: an operator who added a client
 * offline should not have it silently disappear days later. The Sync page
 * carries the reason and the retry/discard actions.
 */
export function SyncBadge({ state }: Props) {
  if (!state) return null;

  const rejected = state.status === 'failed';

  return (
    <span title={state.error ?? undefined} className={rejected ? pill.danger : pill.warn}>
      {rejected ? 'rejected' : 'not synced'}
    </span>
  );
}
